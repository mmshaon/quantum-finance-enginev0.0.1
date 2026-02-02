import { FastifyPluginAsync } from 'fastify';
import bcrypt from 'bcryptjs';

const authRoutes: FastifyPluginAsync = async (fastify) => {
  // Register
  fastify.post('/register', async (request, reply) => {
    const { email, password, fullName, address, phone, companyName, idNumber, emergencyContact } = request.body as any;

    // Validate
    if (!email || !password || !fullName) {
      return reply.status(400).send({ error: 'Email, password, and full name are required' });
    }

    // Check if user exists
    const existing = await fastify.prisma.user.findUnique({ where: { email } });
    if (existing) {
      return reply.status(409).send({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user (pending approval)
    const user = await fastify.prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        address,
        phone,
        idNumber,
        emergencyContact,
        isApproved: false
      }
    });

    // Log audit
    await fastify.prisma.auditLog.create({
      data: {
        userId: user.id,
        actionType: 'REGISTER',
        module: 'AUTH',
        entityType: 'User',
        entityId: user.id
      }
    });

    return {
      message: 'Registration successful. Awaiting admin approval.',
      userId: user.id
    };
  });

  // Login
  fastify.post('/login', async (request, reply) => {
    const { email, password } = request.body as any;

    if (!email || !password) {
      return reply.status(400).send({ error: 'Email and password are required' });
    }

    // Find user
    const user = await fastify.prisma.user.findUnique({
      where: { email },
      include: {
        company: true,
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    if (!user.isApproved) {
      return reply.status(403).send({ error: 'Account pending approval' });
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    // Update last login
    await fastify.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Log audit
    await fastify.prisma.auditLog.create({
      data: {
        userId: user.id,
        companyId: user.companyId,
        actionType: 'LOGIN',
        module: 'AUTH'
      }
    });

    // Generate token
    const token = fastify.jwt.sign({
      userId: user.id,
      email: user.email,
      companyId: user.companyId,
      isCreator: user.isCreator
    }, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });

    // Clean user object
    const { passwordHash, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token
    };
  });

  // Get current user
  fastify.get('/me', { preHandler: [fastify.authenticate] }, async (request) => {
    const { userId } = (request as any).user;

    const user = await fastify.prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: true,
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  });

  // Logout (for audit trail)
  fastify.post('/logout', { preHandler: [fastify.authenticate] }, async (request) => {
    const { userId, companyId } = (request as any).user;

    await fastify.prisma.auditLog.create({
      data: {
        userId,
        companyId,
        actionType: 'LOGOUT',
        module: 'AUTH'
      }
    });

    return { message: 'Logged out successfully' };
  });
};

export default authRoutes;
