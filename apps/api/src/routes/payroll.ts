import { FastifyInstance } from "fastify";
import PDFDocument from "pdfkit";
import { Readable } from "stream";

export async function payrollRoutes(app: FastifyInstance) {
  app.post(
    "/payroll/runs",
    {
      preHandler: [
        app.authenticate,
        app.withCompanyScope,
        app.requirePermission("HR", "CREATE")
      ]
    },
    async (req: any, reply) => {
      const companyId = req.companyId as string;
      const { month, year } = req.body as { month: number; year: number };
      if (!month || !year) return reply.status(400).send({ error: "Month and year are required" });

      const periodStart = new Date(year, month - 1, 1);
      const periodEnd = new Date(year, month, 0, 23, 59, 59, 999);

      const attendances = await app.prisma.staffAttendance.findMany({
        where: {
          companyId,
          date: { gte: periodStart, lte: periodEnd }
        }
      });

      const staffList = await app.prisma.staff.findMany({
        where: { companyId },
        include: { user: { select: { fullName: true, email: true } } }
      });

      const lines = [];
      let totalNetPay = 0;

      for (const staff of staffList) {
        const staffAttendances = attendances.filter((a) => a.staffId === staff.id);
        const present = staffAttendances.filter((a) => a.status === "PRESENT").length;
        const leave = staffAttendances.filter((a) => a.status === "LEAVE").length;
        const dailyRate = Number(staff.dailyRate || 0);
        const baseSalary =
          Number(staff.monthlySalary || 0) || (present + leave) * dailyRate;

        const advanceEntries = await app.prisma.staffAccountLedger.findMany({
          where: { staffId: staff.id, companyId, type: "DEBIT" }
        });
        const advances = advanceEntries.reduce((sum, entry) => sum + Number(entry.amount), 0);

        const allowances = 0;
        const deductions = 0;
        const netPay = baseSalary + allowances - deductions - advances;
        totalNetPay += netPay;

        lines.push({
          staffId: staff.id,
          baseSalary,
          allowances,
          deductions,
          advances,
          netPay
        });
      }

      const run = await app.prisma.payrollRun.create({
        data: {
          companyId,
          month,
          year,
          totalNetPay,
          lines: {
            create: lines
          }
        },
        include: { lines: true }
      });

      const expenseAccount = await app.prisma.account.findFirst({
        where: { companyId, code: "5000" }
      });
      const payableAccount = await app.prisma.account.findFirst({
        where: { companyId, code: "2100" }
      });

      if (expenseAccount && payableAccount) {
        await app.prisma.journalEntry.create({
          data: {
            companyId,
            date: new Date(),
            reference: `PR-${run.id}`,
            description: `Payroll ${year}-${month}`,
            lines: {
              create: [
                { accountId: expenseAccount.id, debit: totalNetPay, credit: 0, memo: "Payroll expense" },
                { accountId: payableAccount.id, debit: 0, credit: totalNetPay, memo: "Staff payable" }
              ]
            }
          }
        });
      }

      return { success: true, run };
    }
  );

  app.get(
    "/payroll/runs",
    {
      preHandler: [
        app.authenticate,
        app.withCompanyScope,
        app.requirePermission("HR", "VIEW")
      ]
    },
    async (req: any) => {
      const companyId = req.companyId as string;
      const runs = await app.prisma.payrollRun.findMany({
        where: { companyId },
        include: {
          lines: {
            include: {
              staff: { include: { user: { select: { fullName: true, email: true } } } }
            }
          }
        },
        orderBy: { createdAt: "desc" }
      });
      return { success: true, runs };
    }
  );

  app.post(
    "/payroll/runs/:id/export",
    {
      preHandler: [
        app.authenticate,
        app.withCompanyScope,
        app.requirePermission("HR", "VIEW")
      ]
    },
    async (req: any, reply) => {
      const { id } = req.params as { id: string };
      const run = await app.prisma.payrollRun.findUnique({
        where: { id },
        include: {
          lines: {
            include: { staff: true }
          }
        }
      });
      if (!run) return reply.status(404).send({ error: "Payroll run not found" });

      const csvRows = run.lines.map((line) => {
        const staff = line.staff;
        return [
          staff.id,
          staff.fullName,
          staff.iban || "",
          line.netPay.toFixed(2)
        ].join(",");
      });

      reply.header("Content-Type", "text/csv");
      reply.header("Content-Disposition", `attachment; filename=payroll-${id}-wps.csv`);
      return reply.send(["Staff ID,Name,IBAN,Amount", ...csvRows].join("\n"));
    }
  );

  app.get(
    "/payroll/runs/:runId/payslip/:staffId",
    {
      preHandler: [
        app.authenticate,
        app.withCompanyScope,
        app.requirePermission("HR", "VIEW")
      ]
    },
    async (req: any, reply) => {
      const { runId, staffId } = req.params as { runId: string; staffId: string };
      const line = await app.prisma.payrollLine.findFirst({
        where: { runId, staffId },
        include: { staff: { include: { user: true } }, run: true }
      });
      if (!line) return reply.status(404).send({ error: "Payline not found" });

      const doc = new PDFDocument({ size: "A4", margin: 40 });
      const stream = new Readable().wrap(doc);
      reply.header("Content-Type", "application/pdf");
      reply.header("Content-Disposition", `attachment; filename=payslip-${staffId}.pdf`);

      doc.fontSize(22).fillColor("#00e5ff").text("Payroll Slip / قسيمة الرواتب", { align: "center" }).moveDown();
      doc.fillColor("white").fontSize(12);
      doc.text(`Employee: ${line.staff.fullName}`);
      doc.text(`Month: ${line.run.month}/${line.run.year}`);
      doc.text(`Net Pay: ${line.netPay.toFixed(2)} SAR`);
      doc.text(`Base Salary: ${line.baseSalary.toFixed(2)} SAR`);
      doc.text(`Advances: ${line.advances.toFixed(2)} SAR`);
      doc.moveDown();
      doc.text("Thank you for your commitment / شكراً لالتزامكم");
      doc.end();
      return reply.send(stream);
    }
  );
}
