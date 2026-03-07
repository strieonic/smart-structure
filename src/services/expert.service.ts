import prisma from '../config/database';
import { AppError } from '../middleware/error.middleware';

interface ExpertFilters {
  type?: string;
  location?: string;
  experience?: string;
}

interface QueryFilters {
  status?: string;
}

interface CreateQueryInput {
  title: string;
  description: string;
  category: string;
  priority?: string;
  projectId?: string;
  expertId?: string;
}

interface QueryResponseInput {
  response: string;
}

export class ExpertService {
  async getExpertDashboard(userId: string) {
    const expertProfile = await prisma.expertProfile.findUnique({
      where: { userId },
    });

    if (!expertProfile) {
      throw new AppError('Expert profile not found', 404);
    }

    // Get query statistics
    const totalPendingQueries = await prisma.expertQuery.count({
      where: {
        OR: [
          { expertId: expertProfile.id, status: { in: ['ASSIGNED', 'IN_PROGRESS'] } },
          { expertId: null, status: 'OPEN' },
        ],
      },
    });

    const totalSolvedQueries = await prisma.expertQuery.count({
      where: {
        expertId: expertProfile.id,
        status: 'RESOLVED',
      },
    });

    const totalAssignedQueries = await prisma.expertQuery.count({
      where: {
        expertId: expertProfile.id,
      },
    });

    // Get recent queries
    const recentQueries = await prisma.expertQuery.findMany({
      where: {
        OR: [
          { expertId: expertProfile.id },
          { expertId: null, status: 'OPEN' },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    return {
      stats: {
        totalPendingQueries,
        totalSolvedQueries,
        totalAssignedQueries,
        profileViews: 0, // Placeholder for future feature
        averageRating: 0, // Placeholder for future feature
      },
      recentQueries,
      expertProfile: {
        id: expertProfile.id,
        expertType: expertProfile.expertType,
        experience: expertProfile.experience,
        location: expertProfile.location,
        specializations: expertProfile.specializations,
        status: expertProfile.status,
      },
    };
  }
  async getExperts(filters: ExpertFilters = {}) {
    const where: any = {
      status: 'VERIFIED',
    };

    if (filters.type) {
      where.expertType = filters.type;
    }

    if (filters.location) {
      where.location = {
        contains: filters.location,
        mode: 'insensitive',
      };
    }

    if (filters.experience) {
      where.experience = filters.experience;
    }

    const experts = await prisma.expertProfile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return experts.map(expert => ({
      id: expert.id,
      name: expert.user.name,
      email: expert.user.email,
      expertType: expert.expertType,
      experience: expert.experience,
      location: expert.location,
      phone: expert.phone,
      specializations: expert.specializations,
      summary: expert.summary,
      status: expert.status,
      verifiedAt: expert.verifiedAt,
    }));
  }

  async getExpertById(id: string) {
    const expert = await prisma.expertProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!expert) {
      throw new AppError('Expert not found', 404);
    }

    return {
      id: expert.id,
      name: expert.user.name,
      email: expert.user.email,
      expertType: expert.expertType,
      experience: expert.experience,
      location: expert.location,
      phone: expert.phone,
      specializations: expert.specializations,
      summary: expert.summary,
      portfolioData: expert.portfolioData,
      status: expert.status,
      verifiedAt: expert.verifiedAt,
    };
  }

  async updateExpertProfile(userId: string, updateData: any) {
    const expert = await prisma.expertProfile.findUnique({
      where: { userId },
    });

    if (!expert) {
      throw new AppError('Expert profile not found', 404);
    }

    const updatedExpert = await prisma.expertProfile.update({
      where: { userId },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return updatedExpert;
  }

  async getExpertQueries(expertId: string, filters: QueryFilters = {}) {
    // First get the expert profile
    const expertProfile = await prisma.expertProfile.findUnique({
      where: { userId: expertId },
    });

    if (!expertProfile) {
      throw new AppError('Expert profile not found', 404);
    }

    const where: any = {
      expertId: expertProfile.id,
    };

    if (filters.status) {
      where.status = filters.status;
    }

    const queries = await prisma.expertQuery.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return queries;
  }

  async createQuery(userId: string, input: CreateQueryInput) {
    const query = await prisma.expertQuery.create({
      data: {
        userId,
        title: input.title,
        description: input.description,
        category: input.category,
        priority: input.priority || 'MEDIUM',
        projectId: input.projectId,
        expertId: input.expertId || null,
        status: input.expertId ? 'ASSIGNED' : 'OPEN',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        expert: input.expertId ? {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        } : false,
      },
    });

    return query;
  }

  async respondToQuery(queryId: string, expertId: string, input: QueryResponseInput) {
    // First get the expert profile
    const expertProfile = await prisma.expertProfile.findUnique({
      where: { userId: expertId },
    });

    if (!expertProfile) {
      throw new AppError('Expert profile not found', 404);
    }

    const query = await prisma.expertQuery.findUnique({
      where: { id: queryId },
    });

    if (!query) {
      throw new AppError('Query not found', 404);
    }

    if (query.expertId !== expertProfile.id) {
      throw new AppError('Not authorized to respond to this query', 403);
    }

    const updatedQuery = await prisma.expertQuery.update({
      where: { id: queryId },
      data: {
        expertResponse: input.response,
        responseAt: new Date(),
        status: 'RESOLVED',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        expert: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return updatedQuery;
  }

  async assignQuery(queryId: string, expertId: string) {
    // First get the expert profile
    const expertProfile = await prisma.expertProfile.findUnique({
      where: { userId: expertId },
    });

    if (!expertProfile) {
      throw new AppError('Expert profile not found', 404);
    }

    const query = await prisma.expertQuery.findUnique({
      where: { id: queryId },
    });

    if (!query) {
      throw new AppError('Query not found', 404);
    }

    if (query.status !== 'OPEN') {
      throw new AppError('Query is not available for assignment', 400);
    }

    const updatedQuery = await prisma.expertQuery.update({
      where: { id: queryId },
      data: {
        expertId: expertProfile.id,
        status: 'ASSIGNED',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        expert: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return updatedQuery;
  }

  async getAllQueries(filters: QueryFilters = {}) {
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    const queries = await prisma.expertQuery.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        expert: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return queries;
  }
}