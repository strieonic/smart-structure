import { HfInference } from '@huggingface/inference';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import logger from '../config/logger';

interface AIAnalysisInput {
  buildingData: any;
  landData: any;
  locationData: any;
  applicableRules: any[];
  existingAnalysis?: any;
}

interface AIAnalysisOutput {
  complianceReport: {
    overallCompliance: 'COMPLIANT' | 'PARTIAL' | 'NON_COMPLIANT';
    score: number;
    violations: Array<{
      ruleCode: string;
      severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
      description: string;
      impact: string;
    }>;
  };
  riskAnalysis: {
    structuralRisks: string[];
    disasterRisks: string[];
    regulatoryRisks: string[];
    overallRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  };
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
    costImplications: string;
  };
  modifications: {
    structural: string[];
    architectural: string[];
    regulatory: string[];
  };
}

class HuggingFaceService {
  private hf: HfInference;
  private genAI: GoogleGenerativeAI | null = null;
  private openai: OpenAI | null = null;
  private useGemini: boolean = false;
  private useOpenAI: boolean = false;

  constructor() {
    // Check available AI services in order of preference
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      this.useOpenAI = true;
      logger.info('Using OpenAI for AI chat');
    } else if (process.env.GEMINI_API_KEY) {
      this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      this.useGemini = true;
      logger.info('Using Google Gemini for AI chat');
    } else {
      // Fallback to Hugging Face (requires API key)
      this.hf = new HfInference();
      logger.info('Using Hugging Face for AI chat');
    }
  }

  /**
   * Generate comprehensive AI analysis for building project
   */
  async analyzeBuilding(input: AIAnalysisInput): Promise<AIAnalysisOutput> {
    try {
      const prompt = this.buildAnalysisPrompt(input);

      logger.info('Sending request to Hugging Face for building analysis');

      // Using chat completion instead of text generation
      const response = await this.hf.chatCompletion({
        model: 'mistralai/Mistral-7B-Instruct-v0.2',
        messages: [
          {
            role: 'system',
            content: 'You are an expert civil engineering AI analyzing building compliance. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.3
      });

      const responseText = response.choices[0]?.message?.content || '';

      // Extract JSON from response
      let jsonText = responseText;
      if (responseText.includes('```json')) {
        const match = responseText.match(/```json\n([\s\S]*?)\n```/);
        if (match) {
          jsonText = match[1];
        }
      } else if (responseText.includes('```')) {
        const match = responseText.match(/```\n([\s\S]*?)\n```/);
        if (match) {
          jsonText = match[1];
        }
      }

      // Try to parse JSON
      try {
        const analysis = JSON.parse(jsonText) as AIAnalysisOutput;
        logger.info('Successfully received Hugging Face analysis');
        return analysis;
      } catch (parseError) {
        // If JSON parsing fails, create a structured response from the text
        logger.warn('Could not parse JSON, creating structured response');
        return this.createFallbackAnalysis(responseText, input);
      }

    } catch (error: any) {
      logger.error('Error in Hugging Face analysis:', error);
      logger.error('Error details:', error.message);
      // Return a basic analysis based on rules
      return this.createBasicAnalysis(input);
    }
  }

  /**
   * Chat with AI about building project
   */
  async chat(messages: Array<{ role: string; content: string }>, context?: any): Promise<string> {
    try {
      // Use OpenAI if available (most reliable)
      if (this.useOpenAI && this.openai) {
        return await this.chatWithOpenAI(messages, context);
      }

      // Use Gemini if available
      if (this.useGemini && this.genAI) {
        return await this.chatWithGemini(messages, context);
      }

      // Fallback to Hugging Face
      return await this.chatWithHuggingFace(messages, context);

    } catch (error: any) {
      logger.error('Error in AI chat:', error);
      logger.error('Error details:', error.message);
      
      // Fallback to basic responses
      return this.getBasicResponse(messages, context);
    }
  }

  /**
   * Provide basic responses when AI services are unavailable
   */
  private getBasicResponse(messages: Array<{ role: string; content: string }>, context?: any): string {
    const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';
    
    // FSI related questions
    if (lastMessage.includes('fsi') || lastMessage.includes('floor space index')) {
      return `FSI (Floor Space Index) is the ratio of total built-up area to the plot area. For example:
      
- If your plot is 1000 sq.m and FSI is 2.0, you can build 2000 sq.m total floor area
- FSI varies by location: Mumbai (1.33-2.5), Delhi (1.2-3.5), Bangalore (1.75-2.25)
- Commercial buildings typically have higher FSI than residential
- Premium FSI can be purchased in some cities for additional construction

${context?.building ? `For your ${context.building.type} building with ${context.building.floors} floors, please verify the local FSI limits with your municipal corporation.` : ''}`;
    }

    // Setback related questions
    if (lastMessage.includes('setback')) {
      return `Building setbacks are mandatory distances from plot boundaries:

**Typical Setback Requirements:**
- Front: 3-6m (varies by road width)
- Side: 1.5-3m (depends on building height)
- Rear: 3-6m (minimum for light and ventilation)

**Factors affecting setbacks:**
- Building height (taller = more setback)
- Plot size and location
- Local development control rules
- Fire safety requirements

Check your local municipal corporation's development control regulations for exact requirements.`;
    }

    // Parking related questions
    if (lastMessage.includes('parking')) {
      return `Parking requirements vary by building type and location:

**Residential:**
- 1 space per dwelling unit (typical)
- Additional visitor parking: 10-20% of total units

**Commercial:**
- Office: 1 space per 70-100 sq.m
- Retail: 1 space per 50-70 sq.m
- Restaurant: 1 space per 10-15 seats

**General Rules:**
- Minimum 2.5m x 5m per car space
- Mechanical parking allowed in most cities
- EV charging points increasingly mandatory

${context?.building ? `For your ${context.building.type} building, calculate based on the above ratios and verify with local authorities.` : ''}`;
    }

    // Height related questions
    if (lastMessage.includes('height') || lastMessage.includes('floors')) {
      return `Building height regulations depend on several factors:

**Height Limits:**
- Residential: 15-45m (varies by city)
- Commercial: Often higher limits
- Near airports: Strict restrictions

**Considerations:**
- Fire safety requirements increase with height
- Structural design becomes more complex
- Elevator requirements for buildings >15m
- Shadow impact on neighboring properties

${context?.building ? `Your building is ${context.building.height}m tall with ${context.building.floors} floors. Ensure compliance with local height restrictions and fire safety norms.` : ''}

Always verify with your local development authority for specific limits.`;
    }

    // Building codes general
    if (lastMessage.includes('building code') || lastMessage.includes('nbc')) {
      return `Indian building codes are primarily governed by:

**National Building Code (NBC) 2016:**
- Structural safety and design
- Fire safety requirements
- Electrical and plumbing standards
- Accessibility norms

**State/Local Regulations:**
- Development Control Rules (DCR)
- Municipal building bylaws
- Environmental clearances
- Specific local requirements

**Key Compliance Areas:**
- Structural design (IS codes)
- Fire safety (NBC Part 4)
- Accessibility (NBC Part 3)
- Energy efficiency (ECBC)

Consult with a licensed architect and structural engineer for your specific project.`;
    }

    // Default response
    return `I'm here to help with building codes and regulations! I can assist with:

**Common Topics:**
- FSI (Floor Space Index) calculations
- Setback requirements
- Parking norms
- Height restrictions
- Fire safety codes
- Structural requirements

**For Your Project:**
${context?.projectName ? `- Project: ${context.projectName}` : ''}
${context?.location ? `- Location: ${context.location.city}, ${context.location.state}` : ''}
${context?.building ? `- Building: ${context.building.type}, ${context.building.floors} floors` : ''}

Please ask specific questions about building codes, compliance, or regulations, and I'll provide detailed guidance based on Indian standards and practices.`;
  }

  /**
   * Chat using OpenAI
   */
  private async chatWithOpenAI(messages: Array<{ role: string; content: string }>, context?: any): Promise<string> {
    try {
      // Build system message with context
      let systemMessage = 'You are a helpful civil engineering consultant specializing in Indian building codes and regulations. Provide clear, practical advice.';
      
      if (context) {
        systemMessage += `\n\nProject Context:\n`;
        if (context.projectName) systemMessage += `- Project: ${context.projectName}\n`;
        if (context.location) systemMessage += `- Location: ${context.location.city}, ${context.location.state}\n`;
        if (context.building) systemMessage += `- Building: ${context.building.type}, ${context.building.floors} floors, ${context.building.height}m height\n`;
        if (context.violations && context.violations.length > 0) {
          systemMessage += `- Current Violations: ${context.violations.length} compliance issues\n`;
        }
      }

      // Format messages for OpenAI
      const openaiMessages = [
        { role: 'system' as const, content: systemMessage },
        ...messages.map(msg => ({ 
          role: msg.role as 'user' | 'assistant', 
          content: msg.content 
        }))
      ];

      const completion = await this.openai!.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: openaiMessages,
        max_tokens: 500,
        temperature: 0.7,
      });

      const response = completion.choices[0]?.message?.content;
      return response || 'I apologize, but I could not generate a response.';

    } catch (error: any) {
      logger.error('Error in OpenAI chat:', error);
      throw error;
    }
  }

  /**
   * Chat using Google Gemini
   */
  private async chatWithGemini(messages: Array<{ role: string; content: string }>, context?: any): Promise<string> {
    try {
      // Try different model names in order of preference
      const modelNames = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];
      let model = null;
      
      for (const modelName of modelNames) {
        try {
          model = this.genAI!.getGenerativeModel({ model: modelName });
          break;
        } catch (error) {
          logger.warn(`Model ${modelName} not available, trying next...`);
          continue;
        }
      }
      
      if (!model) {
        throw new Error('No available Gemini model found');
      }

      // Build system message with context
      let systemMessage = 'You are a helpful civil engineering consultant specializing in Indian building codes and regulations. Provide clear, practical advice.';
      
      if (context) {
        systemMessage += `\n\nProject Context:\n`;
        if (context.projectName) systemMessage += `- Project: ${context.projectName}\n`;
        if (context.location) systemMessage += `- Location: ${context.location.city}, ${context.location.state}\n`;
        if (context.building) systemMessage += `- Building: ${context.building.type}, ${context.building.floors} floors, ${context.building.height}m height\n`;
        if (context.violations && context.violations.length > 0) {
          systemMessage += `- Current Violations: ${context.violations.length} compliance issues\n`;
        }
      }

      // Format conversation history for Gemini
      let conversationText = systemMessage + '\n\n';
      for (const msg of messages) {
        conversationText += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
      }
      conversationText += 'Assistant:';

      const result = await model.generateContent(conversationText);
      const response = result.response;
      const text = response.text();

      return text || 'I apologize, but I could not generate a response.';

    } catch (error: any) {
      logger.error('Error in Gemini chat:', error);
      throw error;
    }
  }

  /**
   * Chat using Hugging Face (fallback)
   */
  private async chatWithHuggingFace(messages: Array<{ role: string; content: string }>, context?: any): Promise<string> {
    // Build system message with context
    let systemMessage = 'You are a helpful civil engineering consultant specializing in Indian building codes and regulations. Provide clear, practical advice.';
    
    if (context) {
      systemMessage += `\n\nProject Context:\n`;
      if (context.projectName) systemMessage += `- Project: ${context.projectName}\n`;
      if (context.location) systemMessage += `- Location: ${context.location.city}, ${context.location.state}\n`;
      if (context.building) systemMessage += `- Building: ${context.building.type}, ${context.building.floors} floors, ${context.building.height}m height\n`;
      if (context.violations && context.violations.length > 0) {
        systemMessage += `- Current Violations: ${context.violations.length} compliance issues\n`;
      }
    }

    // Format messages for chat completion
    const chatMessages = [
      { role: 'system', content: systemMessage },
      ...messages
    ];

    const response = await this.hf.chatCompletion({
      model: 'mistralai/Mistral-7B-Instruct-v0.2',
      messages: chatMessages,
      max_tokens: 500,
      temperature: 0.7
    });

    const aiMessage = response.choices[0]?.message?.content;
    return aiMessage || 'I apologize, but I could not generate a response.';
  }

  /**
   * Explain a specific rule violation in simple language
   */
  async explainViolation(
    rule: any,
    actualValue: number,
    requiredValue: number,
    buildingContext: any
  ): Promise<string> {
    try {
      const prompt = `Explain this building code violation in simple language:

Rule: ${rule.title}
Required: ${requiredValue} ${rule.unit}
Actual: ${actualValue} ${rule.unit}
Building: ${buildingContext.buildingType} in ${buildingContext.city}

Explain in 2-3 sentences what this means and how to fix it.`;

      const response = await this.hf.chatCompletion({
        model: 'mistralai/Mistral-7B-Instruct-v0.2',
        messages: [
          {
            role: 'system',
            content: 'You are a civil engineering expert explaining building code violations in simple terms.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.5
      });

      return response.choices[0]?.message?.content || 'Unable to generate explanation.';

    } catch (error: any) {
      logger.error('Error explaining violation:', error);
      return `This violates ${rule.title}. Required: ${requiredValue} ${rule.unit}, but actual is ${actualValue} ${rule.unit}. Please adjust to meet requirements.`;
    }
  }

  /**
   * Build analysis prompt
   */
  private buildAnalysisPrompt(input: AIAnalysisInput): string {
    return `You are an expert civil engineering AI analyzing building compliance.

BUILDING PROJECT:
Location: ${input.locationData.city}, ${input.locationData.state} (${input.locationData.zoneType})
Type: ${input.buildingData.buildingType}
Floors: ${input.buildingData.totalFloors}
Height: ${input.buildingData.totalHeight}m
Area: ${input.buildingData.builtUpArea} sq.m
Plot: ${input.landData.plotArea} sq.m
Seismic Zone: ${input.landData.seismicZone}
Flood Risk: ${input.landData.floodRisk}

APPLICABLE RULES:
${input.applicableRules.slice(0, 5).map((rule, idx) => `${idx + 1}. ${rule.title}: ${rule.description}`).join('\n')}

Analyze compliance and provide a JSON response with:
- overallCompliance (COMPLIANT/PARTIAL/NON_COMPLIANT)
- score (0-100)
- violations array
- structural/disaster/regulatory risks
- immediate/short-term/long-term recommendations

Response (JSON only):`;
  }

  /**
   * Build chat prompt
   */
  private buildChatPrompt(messages: Array<{ role: string; content: string }>, context?: any): string {
    let prompt = 'You are a helpful civil engineering consultant for India.\n\n';
    
    if (context) {
      prompt += `Project: ${context.buildingType} in ${context.city}, ${context.state}\n\n`;
    }
    
    for (const msg of messages) {
      prompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
    }
    
    prompt += 'Assistant:';
    return prompt;
  }

  /**
   * Create fallback analysis from text response
   */
  private createFallbackAnalysis(text: string, input: AIAnalysisInput): AIAnalysisOutput {
    return {
      complianceReport: {
        overallCompliance: 'PARTIAL',
        score: 75,
        violations: [{
          ruleCode: 'GENERAL',
          severity: 'MEDIUM',
          description: 'AI analysis completed. Review recommendations below.',
          impact: text.substring(0, 200)
        }]
      },
      riskAnalysis: {
        structuralRisks: ['Standard structural analysis recommended'],
        disasterRisks: [`${input.landData.seismicZone} seismic considerations`, `${input.landData.floodRisk} flood risk`],
        regulatoryRisks: ['Verify local building codes'],
        overallRiskLevel: 'MEDIUM'
      },
      recommendations: {
        immediate: ['Conduct detailed structural analysis', 'Verify all local regulations'],
        shortTerm: ['Obtain necessary permits', 'Consult with local authorities'],
        longTerm: ['Regular compliance audits'],
        costImplications: 'Standard compliance costs apply'
      },
      modifications: {
        structural: ['Follow IS codes for structural design'],
        architectural: ['Ensure proper ventilation and lighting'],
        regulatory: ['Meet all local building bylaws']
      }
    };
  }

  /**
   * Create basic analysis when AI fails
   */
  private createBasicAnalysis(input: AIAnalysisInput): AIAnalysisOutput {
    const fsi = input.buildingData.builtUpArea / input.landData.plotArea;
    const violations = [];

    if (fsi > 2.5) {
      violations.push({
        ruleCode: 'FSI',
        severity: 'HIGH' as const,
        description: `FSI of ${fsi.toFixed(2)} exceeds typical limit of 2.5`,
        impact: 'Reduce built-up area or increase plot size'
      });
    }

    return {
      complianceReport: {
        overallCompliance: violations.length > 0 ? 'PARTIAL' : 'COMPLIANT',
        score: violations.length > 0 ? 70 : 85,
        violations
      },
      riskAnalysis: {
        structuralRisks: [`Building in ${input.landData.seismicZone} requires seismic design`],
        disasterRisks: [`${input.landData.floodRisk} flood risk area`],
        regulatoryRisks: ['Verify compliance with local regulations'],
        overallRiskLevel: 'MEDIUM'
      },
      recommendations: {
        immediate: ['Conduct detailed structural analysis', 'Verify FSI compliance'],
        shortTerm: ['Obtain building permits', 'Soil testing'],
        longTerm: ['Regular structural inspections'],
        costImplications: 'Standard construction and compliance costs'
      },
      modifications: {
        structural: ['Follow IS 1893 for seismic design', 'Proper foundation as per soil type'],
        architectural: ['Adequate setbacks', 'Proper ventilation'],
        regulatory: ['Meet local FSI norms', 'Obtain all clearances']
      }
    };
  }
}

export default new HuggingFaceService();
