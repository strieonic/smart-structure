import { Request, Response } from 'express';
import prisma from '../config/database';
import logger from '../config/logger';
import locationService from '../services/location.service';
import hybridAnalysisService from '../services/hybridAnalysis.service';

export const createProject = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { projectName, latitude, longitude, landSurveyId, buildingInputId, projectType } = req.body;

    // Validate required fields
    if (!projectName || !latitude || !longitude) {
      return res.status(400).json({
        status: 'error',
        message: 'Project name, latitude, and longitude are required'
      });
    }

    // Get or create location data
    logger.info(`Creating project with location: ${latitude}, ${longitude}`);
    const location = await locationService.getOrCreateLocation(latitude, longitude);

    // Get applicable rules
    const applicableRules = await locationService.getApplicableRules(location.id);

    // Create project
    const project = await prisma.buildingProject.create({
      data: {
        userId: userId!,
        locationId: location.id,
        buildingInputId,
        projectName,
        projectType: projectType || 'RESIDENTIAL',
        status: 'DRAFT'
      },
      include: {
        location: true,
        buildingInput: {
          include: {
            landSurvey: true
          }
        }
      }
    });

    logger.info(`Project created: ${project.id}`);

    res.status(201).json({
      status: 'success',
      data: {
        project,
        applicableRules: applicableRules.map(r => ({
          id: r.id,
          ruleCode: r.ruleCode,
          title: r.title,
          category: r.ruleCategory,
          description: r.description
        }))
      }
    });

  } catch (error: any) {
    logger.error('Error creating project:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

export const getProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const project = await prisma.buildingProject.findFirst({
      where: {
        id,
        userId: userId!
      },
      include: {
        location: true,
        buildingInput: {
          include: {
            landSurvey: true,
            disasterAnalysis: true,
            vastuReport: true
          }
        },
        complianceChecks: {
          include: {
            rule: true
          }
        }
      }
    });

    if (!project) {
      return res.status(404).json({
        status: 'error',
        message: 'Project not found'
      });
    }

    res.json({
      status: 'success',
      data: project
    });

  } catch (error: any) {
    logger.error('Error fetching project:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

export const listProjects = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { status } = req.query;

    const where: any = { userId: userId! };
    if (status) {
      where.status = status;
    }

    const projects = await prisma.buildingProject.findMany({
      where,
      include: {
        location: true,
        buildingInput: {
          select: {
            buildingType: true,
            totalFloors: true,
            totalHeight: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      status: 'success',
      data: projects
    });

  } catch (error: any) {
    logger.error('Error listing projects:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

export const runAnalysis = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Verify project ownership
    const project = await prisma.buildingProject.findFirst({
      where: {
        id,
        userId: userId!
      },
      include: {
        buildingInput: true
      }
    });

    if (!project) {
      return res.status(404).json({
        status: 'error',
        message: 'Project not found'
      });
    }

    if (!project.buildingInput) {
      return res.status(400).json({
        status: 'error',
        message: 'Project must have building input data'
      });
    }

    // Mark analysis as requested
    await prisma.buildingProject.update({
      where: { id },
      data: {
        aiAnalysisRequested: true,
        status: 'ANALYZING'
      }
    });

    // Run hybrid analysis
    logger.info(`Starting hybrid analysis for project: ${id}`);
    const analysis = await hybridAnalysisService.runCompleteAnalysis({
      projectId: id,
      buildingInputId: project.buildingInputId!,
      landSurveyId: project.buildingInput.landSurveyId
    });

    // Update project status
    await prisma.buildingProject.update({
      where: { id },
      data: {
        status: 'COMPLETED'
      }
    });

    res.json({
      status: 'success',
      data: analysis
    });

  } catch (error: any) {
    logger.error('Error running analysis:', error);
    
    // Update project status to error
    await prisma.buildingProject.update({
      where: { id: req.params.id },
      data: { status: 'DRAFT' }
    }).catch(() => {});

    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

export const getAnalysisStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const project = await prisma.buildingProject.findFirst({
      where: {
        id,
        userId: userId!
      }
    });

    if (!project) {
      return res.status(404).json({
        status: 'error',
        message: 'Project not found'
      });
    }

    const analysisStatus = await hybridAnalysisService.getAnalysisStatus(id);

    res.json({
      status: 'success',
      data: {
        projectStatus: project.status,
        ...analysisStatus
      }
    });

  } catch (error: any) {
    logger.error('Error fetching analysis status:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

export const updateProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { projectName, status } = req.body;

    const project = await prisma.buildingProject.findFirst({
      where: {
        id,
        userId: userId!
      }
    });

    if (!project) {
      return res.status(404).json({
        status: 'error',
        message: 'Project not found'
      });
    }

    const updated = await prisma.buildingProject.update({
      where: { id },
      data: {
        ...(projectName && { projectName }),
        ...(status && { status })
      }
    });

    res.json({
      status: 'success',
      data: updated
    });

  } catch (error: any) {
    logger.error('Error updating project:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const project = await prisma.buildingProject.findFirst({
      where: {
        id,
        userId: userId!
      }
    });

    if (!project) {
      return res.status(404).json({
        status: 'error',
        message: 'Project not found'
      });
    }

    await prisma.buildingProject.delete({
      where: { id }
    });

    res.json({
      status: 'success',
      message: 'Project deleted successfully'
    });

  } catch (error: any) {
    logger.error('Error deleting project:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};
