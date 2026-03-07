import { Request, Response } from 'express';
import prisma from '../config/database';
import logger from '../config/logger';
import huggingfaceService from '../services/huggingface.service';

export const createChatSession = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { projectId } = req.body;

    if (!projectId) {
      return res.status(400).json({
        status: 'error',
        message: 'Project ID is required'
      });
    }

    // Verify project ownership
    const project = await prisma.buildingProject.findFirst({
      where: {
        id: projectId,
        userId: userId!
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

    if (!project) {
      return res.status(404).json({
        status: 'error',
        message: 'Project not found'
      });
    }

    // Create chat session
    const session = await prisma.chatSession.create({
      data: {
        projectId,
        userId: userId!,
        sessionTitle: `Consultation for ${project.projectName}`,
        conversationContext: {
          projectName: project.projectName,
          location: {
            city: project.location.city,
            state: project.location.state,
            zoneType: project.location.zoneType
          },
          building: project.buildingInput ? {
            type: project.buildingInput.buildingType,
            floors: project.buildingInput.totalFloors,
            height: project.buildingInput.totalHeight
          } : null
        }
      }
    });

    // Create initial system message
    const welcomeMessage = `Hello! I'm your AI Civil Engineering Consultant. I can help you with:

- Understanding building codes and regulations
- Explaining compliance violations
- Suggesting solutions to meet requirements
- Answering questions about construction norms
- Providing guidance on structural safety

What would you like to know about your project "${project.projectName}"?`;

    await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: 'assistant',
        content: welcomeMessage
      }
    });

    logger.info(`Chat session created: ${session.id}`);

    res.status(201).json({
      status: 'success',
      data: {
        session,
        welcomeMessage
      }
    });

  } catch (error: any) {
    logger.error('Error creating chat session:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { id: sessionId } = req.params;
    const userId = req.user?.id;
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Message content is required'
      });
    }

    // Verify session ownership
    const session = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        userId: userId!,
        isActive: true
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 20 // Last 20 messages for context
        },
        project: {
          include: {
            location: true,
            buildingInput: true,
            complianceChecks: {
              where: { isCompliant: false },
              include: { rule: true }
            }
          }
        }
      }
    });

    if (!session) {
      return res.status(404).json({
        status: 'error',
        message: 'Chat session not found or inactive'
      });
    }

    // Save user message
    await prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'user',
        content: message
      }
    });

    // Prepare conversation history
    const conversationHistory = session.messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Add current message
    conversationHistory.push({
      role: 'user',
      content: message
    });

    // Prepare context
    const context: any = {
      ...(session.conversationContext as any),
      violations: session.project.complianceChecks.map(check => ({
        rule: check.rule.title,
        severity: check.severity,
        recommendation: check.recommendation
      }))
    };

    // Get AI response
    logger.info(`Sending message to Hugging Face AI for session: ${sessionId}`);
    const aiResponse = await huggingfaceService.chat(conversationHistory, context);

    // Save AI response
    const assistantMessage = await prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'assistant',
        content: aiResponse,
        model: 'mistralai/Mistral-7B-Instruct-v0.2'
      }
    });

    // Update session timestamp
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() }
    });

    res.json({
      status: 'success',
      data: {
        message: assistantMessage,
        suggestions: generateSuggestions(aiResponse, session.project)
      }
    });

  } catch (error: any) {
    logger.error('Error sending message:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

export const getChatHistory = async (req: Request, res: Response) => {
  try {
    const { id: sessionId } = req.params;
    const userId = req.user?.id;

    const session = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        userId: userId!
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        },
        project: {
          select: {
            projectName: true,
            status: true
          }
        }
      }
    });

    if (!session) {
      return res.status(404).json({
        status: 'error',
        message: 'Chat session not found'
      });
    }

    res.json({
      status: 'success',
      data: session
    });

  } catch (error: any) {
    logger.error('Error fetching chat history:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

export const listChatSessions = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { projectId, isActive } = req.query;

    const where: any = { userId: userId! };
    if (projectId) where.projectId = projectId;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const sessions = await prisma.chatSession.findMany({
      where,
      include: {
        project: {
          select: {
            projectName: true,
            status: true
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1 // Last message
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    res.json({
      status: 'success',
      data: sessions
    });

  } catch (error: any) {
    logger.error('Error listing chat sessions:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

export const closeChatSession = async (req: Request, res: Response) => {
  try {
    const { id: sessionId } = req.params;
    const userId = req.user?.id;

    const session = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        userId: userId!
      }
    });

    if (!session) {
      return res.status(404).json({
        status: 'error',
        message: 'Chat session not found'
      });
    }

    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { isActive: false }
    });

    res.json({
      status: 'success',
      message: 'Chat session closed'
    });

  } catch (error: any) {
    logger.error('Error closing chat session:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Helper function to generate follow-up suggestions
function generateSuggestions(aiResponse: string, project: any): string[] {
  const suggestions: string[] = [];

  // Check if response mentions specific topics
  if (aiResponse.toLowerCase().includes('fsi') || aiResponse.toLowerCase().includes('floor space')) {
    suggestions.push('How can I reduce my FSI?');
    suggestions.push('What are the FSI limits in my area?');
  }

  if (aiResponse.toLowerCase().includes('height')) {
    suggestions.push('What is the maximum allowed height?');
    suggestions.push('Can I add more floors?');
  }

  if (aiResponse.toLowerCase().includes('setback')) {
    suggestions.push('How much setback do I need?');
    suggestions.push('Can I reduce the setback distance?');
  }

  if (aiResponse.toLowerCase().includes('parking')) {
    suggestions.push('How many parking spaces do I need?');
    suggestions.push('Can I use mechanical parking?');
  }

  // Default suggestions if none matched
  if (suggestions.length === 0) {
    suggestions.push('What are the main violations in my project?');
    suggestions.push('How can I make my building compliant?');
    suggestions.push('What will it cost to fix these issues?');
  }

  return suggestions.slice(0, 3); // Return max 3 suggestions
}
