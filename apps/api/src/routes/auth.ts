import { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";

interface RegisterBody {
  email: string;
  password: string;
  fullName: string;
  address?: string;
  companyName?: string;
  profileImage?: string;
  idImage?: string;
  idNumber?: string;
  phone?: string;
  emergencyContact?: string;
}

interface LoginBody {
  email: string;
  password: string;
}

export async function authRoutes(app: FastifyInstance) {
  // Registration: creates a pending user
  app.post("/auth/register", async (req, reply) => {
    const body = req.body as RegisterBody;

    if (!body.email || !body.password || !body.fullName) {
      return reply.status(400).send({ error: "Missing required fields" });
    }

    const existing = await app.prisma.user.findUnique({
      where: { email: body.email }
    });
    if (existing) {
      return reply.status(400).send({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(body.password, 12);

    const user = await app.prisma.user.create({
      data: {
        email: body.email,
        passwordHash,
        fullName: body.fullName,
        address: body.address,
        profileImage: body.profileImage,
        idImage: body.idImage,
        idNumber: body.idNumber,
        phone: body.phone,
        emergencyContact: body.emergencyContact,
        isApproved: false,
        isCreator: false
      }
    });

    await app.prisma.auditLog.create({
      data: {
        userId: user.id,
        actionType: "REGISTER",
        module: "AUTH",
        entityType: "User",
        entityId: user.id,
        metadata: {
          email: user.email
        }
      }
    });

    return reply.status(201).send({
      success: true,
      message: "Registration submitted for approval",
      userId: user.id
    });
  });

  // Login: only approved users
  app.post("/auth/login", async (req, reply) => {
    const body = req.body as LoginBody;

    if (!body.email || !body.password) {
      return reply.status(400).send({ error: "Missing credentials" });
    }

    const user = await app.prisma.user.findUnique({
      where: { email: body.email }
    });

    if (!user) {
      return reply.status(400).send({ error: "Invalid credentials" });
    }

    if (!user.isApproved) {
      return reply.status(403).send({ error: "Account pending approval" });
    }

    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) {
      return reply.status(400).send({ error: "Invalid credentials" });
    }

    const token = app.jwt.sign({
      userId: user.id,
      companyId: user.companyId,
      isCreator: user.isCreator
    });

    await app.prisma.auditLog.create({
      data: {
        userId: user.id,
        companyId: user.companyId || undefined,
        actionType: "LOGIN",
        module: "AUTH",
        entityType: "User",
        entityId: user.id
      }
    });

    return reply.send({
      success: true,
      token
    });
  });
}
