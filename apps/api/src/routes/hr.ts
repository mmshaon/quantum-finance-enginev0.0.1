import { FastifyPluginAsync } from 'fastify';

const hrRoutes: FastifyPluginAsync = async (fastify) => {
  // Get all staff
  fastify.get('/staff', { preHandler: [fastify.authenticate] }, async (request) => {
    const { companyId } = (request as any).user;

    const staff = await fastify.prisma.staff.findMany({
      where: { companyId, deletedAt: null },
      include: {
        user: {
          select: {
            email: true,
            isApproved: true
          }
        }
      },
      orderBy: { fullName: 'asc' }
    });

    return staff;
  });

  // Get staff by ID
  fastify.get('/staff/:id', { preHandler: [fastify.authenticate] }, async (request) => {
    const { id } = request.params as any;
    const { companyId } = (request as any).user;

    const staff = await fastify.prisma.staff.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        user: true,
        accountLedger: {
          orderBy: { createdAt: 'desc' }
        },
        attendanceRecords: {
          orderBy: { date: 'desc' },
          take: 30
        },
        salarySheets: {
          orderBy: { year: 'desc', month: 'desc' }
        }
      }
    });

    if (!staff) {
      throw { statusCode: 404, message: 'Staff not found' };
    }

    return staff;
  });

  // Create staff
  fastify.post('/staff', { preHandler: [fastify.authenticate] }, async (request) => {
    const { userId, companyId } = (request as any).user;
    const { fullName, position, department, phone, address, idNumber } = request.body as any;

    const staff = await fastify.prisma.staff.create({
      data: {
        companyId,
        fullName,
        position,
        department,
        phone,
        address,
        idNumber
      }
    });

    await fastify.prisma.auditLog.create({
      data: {
        userId,
        companyId,
        actionType: 'CREATE',
        module: 'HR_ADMIN',
        entityType: 'Staff',
        entityId: staff.id
      }
    });

    return staff;
  });

  // Mark attendance
  fastify.post('/attendance', { preHandler: [fastify.authenticate] }, async (request) => {
    const { userId, companyId } = (request as any).user;
    const { staffId, date, status, checkInTime, checkOutTime, notes } = request.body as any;

    const attendance = await fastify.prisma.staffAttendance.upsert({
      where: {
        staffId_date: {
          staffId,
          date: new Date(date)
        }
      },
      create: {
        staffId,
        companyId,
        date: new Date(date),
        status,
        checkInTime: checkInTime ? new Date(checkInTime) : null,
        checkOutTime: checkOutTime ? new Date(checkOutTime) : null,
        notes
      },
      update: {
        status,
        checkInTime: checkInTime ? new Date(checkInTime) : null,
        checkOutTime: checkOutTime ? new Date(checkOutTime) : null,
        notes
      }
    });

    await fastify.prisma.auditLog.create({
      data: {
        userId,
        companyId,
        actionType: 'CREATE',
        module: 'HR_ADMIN',
        entityType: 'StaffAttendance',
        entityId: attendance.id,
        metadata: { staffId, date, status }
      }
    });

    return attendance;
  });

  // Generate salary sheet
  fastify.post('/salary-sheet', { preHandler: [fastify.authenticate] }, async (request) => {
    const { userId, companyId } = (request as any).user;
    const { staffId, month, year, baseSalary, allowances, deductions } = request.body as any;

    const netPay = baseSalary + allowances - deductions;

    const salarySheet = await fastify.prisma.staffSalarySheet.upsert({
      where: {
        staffId_month_year: {
          staffId,
          month,
          year
        }
      },
      create: {
        staffId,
        companyId,
        month,
        year,
        baseSalary,
        allowances,
        deductions,
        netPay,
        status: 'PENDING'
      },
      update: {
        baseSalary,
        allowances,
        deductions,
        netPay
      }
    });

    await fastify.prisma.auditLog.create({
      data: {
        userId,
        companyId,
        actionType: 'CREATE',
        module: 'HR_ADMIN',
        entityType: 'StaffSalarySheet',
        entityId: salarySheet.id,
        metadata: { staffId, month, year, netPay }
      }
    });

    return salarySheet;
  });
};

export default hrRoutes;
