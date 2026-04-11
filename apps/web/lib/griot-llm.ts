import { griotConfig } from './constants';

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface LLMResponse {
    content: string;
    error?: string;
}

export interface StreamChunk {
    content: string;
    done: boolean;
    error?: string;
}

export type StreamCallback = (chunk: StreamChunk) => void;

class GriotLLMService {
    private config = griotConfig.llm;

    async chat(messages: ChatMessage[]): Promise<LLMResponse> {
        try {
            switch (this.config.provider) {
                case 'ollama':
                    return await this.chatOllama(messages);
                case 'vllm':
                    return await this.chatVLLM(messages);
                case 'llamacpp':
                    return await this.chatLlamaCpp(messages);
                case 'openshift-ai':
                    return await this.chatOpenShiftAI(messages);
                default:
                    throw new Error(`Unsupported LLM provider: ${this.config.provider}`);
            }
        } catch (error) {
            console.error('LLM Service Error:', error);
            return {
                content: "I apologize, but I'm having trouble connecting to the knowledge base right now. Please try again in a moment.",
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    async chatStream(messages: ChatMessage[], onChunk: StreamCallback): Promise<void> {
        try {
            switch (this.config.provider) {
                case 'ollama':
                    return await this.chatOllamaStream(messages, onChunk);
                case 'vllm':
                    return await this.chatVLLMStream(messages, onChunk);
                case 'llamacpp':
                    return await this.chatLlamaCppStream(messages, onChunk);
                case 'openshift-ai':
                    return await this.chatOpenShiftAIStream(messages, onChunk);
                default:
                    throw new Error(`Unsupported LLM provider: ${this.config.provider}`);
            }
        } catch (error) {
            console.error('LLM Service Stream Error:', error);
            onChunk({
                content: "I apologize, but I'm having trouble connecting to the knowledge base right now. Please try again in a moment.",
                done: true,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    private async chatOllama(messages: ChatMessage[]): Promise<LLMResponse> {
        const response = await fetch(`${this.config.baseUrl}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...this.config.headers,
            },
            body: JSON.stringify({
                model: this.config.model,
                messages: messages,
                stream: false,
            }),
            signal: AbortSignal.timeout(this.config.timeout),
        });

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return {
            content: data.message?.content || "I apologize, but I couldn't generate a response.",
        };
    }

    private async chatOllamaStream(messages: ChatMessage[], onChunk: StreamCallback): Promise<void> {
        const response = await fetch(`${this.config.baseUrl}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...this.config.headers,
            },
            body: JSON.stringify({
                model: this.config.model,
                messages: messages,
                stream: true,
            }),
            signal: AbortSignal.timeout(this.config.timeout),
        });

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
            throw new Error('Response body is not readable');
        }

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(line => line.trim());
                
                for (const line of lines) {
                    try {
                        const data = JSON.parse(line);
                        
                        if (data.message?.content) {
                            onChunk({
                                content: data.message.content,
                                done: data.done || false,
                            });
                        }
                        
                        if (data.done) {
                            onChunk({ content: '', done: true });
                            return;
                        }
                    } catch (e) {
                        // Skip invalid JSON lines
                        console.warn('Failed to parse Ollama stream chunk:', e);
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }
    }

    private async chatVLLM(messages: ChatMessage[]): Promise<LLMResponse> {
        const response = await fetch(`${this.config.baseUrl}/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
                ...this.config.headers,
            },
            body: JSON.stringify({
                model: this.config.model,
                messages: messages,
                max_tokens: 1000,
                temperature: 0.7,
            }),
            signal: AbortSignal.timeout(this.config.timeout),
        });

        if (!response.ok) {
            throw new Error(`vLLM API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return {
            content: data.choices?.[0]?.message?.content || "I apologize, but I couldn't generate a response.",
        };
    }

    private async chatVLLMStream(messages: ChatMessage[], onChunk: StreamCallback): Promise<void> {
        const response = await fetch(`${this.config.baseUrl}/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
                ...this.config.headers,
            },
            body: JSON.stringify({
                model: this.config.model,
                messages: messages,
                max_tokens: 1000,
                temperature: 0.7,
                stream: true,
            }),
            signal: AbortSignal.timeout(this.config.timeout),
        });

        if (!response.ok) {
            throw new Error(`vLLM API error: ${response.status} ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
            throw new Error('Response body is not readable');
        }

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(line => line.trim());
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') {
                            onChunk({ content: '', done: true });
                            return;
                        }
                        
                        try {
                            const parsed = JSON.parse(data);
                            const content = parsed.choices?.[0]?.delta?.content;
                            
                            if (content) {
                                onChunk({
                                    content: content,
                                    done: false,
                                });
                            }
                        } catch (e) {
                            console.warn('Failed to parse vLLM stream chunk:', e);
                        }
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }
    }

    private async chatLlamaCpp(messages: ChatMessage[]): Promise<LLMResponse> {
        const response = await fetch(`${this.config.baseUrl}/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...this.config.headers,
            },
            body: JSON.stringify({
                messages: messages,
                max_tokens: 1000,
                temperature: 0.7,
            }),
            signal: AbortSignal.timeout(this.config.timeout),
        });

        if (!response.ok) {
            throw new Error(`llama.cpp API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return {
            content: data.choices?.[0]?.message?.content || "I apologize, but I couldn't generate a response.",
        };
    }

    private async chatLlamaCppStream(messages: ChatMessage[], onChunk: StreamCallback): Promise<void> {
        const response = await fetch(`${this.config.baseUrl}/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...this.config.headers,
            },
            body: JSON.stringify({
                messages: messages,
                max_tokens: 1000,
                temperature: 0.7,
                stream: true,
            }),
            signal: AbortSignal.timeout(this.config.timeout),
        });

        if (!response.ok) {
            throw new Error(`llama.cpp API error: ${response.status} ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
            throw new Error('Response body is not readable');
        }

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(line => line.trim());
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') {
                            onChunk({ content: '', done: true });
                            return;
                        }
                        
                        try {
                            const parsed = JSON.parse(data);
                            const content = parsed.choices?.[0]?.delta?.content;
                            
                            if (content) {
                                onChunk({
                                    content: content,
                                    done: false,
                                });
                            }
                        } catch (e) {
                            console.warn('Failed to parse llama.cpp stream chunk:', e);
                        }
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }
    }

    private async chatOpenShiftAI(messages: ChatMessage[]): Promise<LLMResponse> {
        const response = await fetch(`${this.config.baseUrl}/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
                ...this.config.headers,
            },
            body: JSON.stringify({
                model: this.config.model,
                messages: messages,
                max_tokens: 1000,
                temperature: 0.7,
            }),
            signal: AbortSignal.timeout(this.config.timeout),
        });

        if (!response.ok) {
            throw new Error(`OpenShift AI API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return {
            content: data.choices?.[0]?.message?.content || "I apologize, but I couldn't generate a response.",
        };
    }

    private async chatOpenShiftAIStream(messages: ChatMessage[], onChunk: StreamCallback): Promise<void> {
        const response = await fetch(`${this.config.baseUrl}/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
                ...this.config.headers,
            },
            body: JSON.stringify({
                model: this.config.model,
                messages: messages,
                max_tokens: 1000,
                temperature: 0.7,
                stream: true,
            }),
            signal: AbortSignal.timeout(this.config.timeout),
        });

        if (!response.ok) {
            throw new Error(`OpenShift AI API error: ${response.status} ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
            throw new Error('Response body is not readable');
        }

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(line => line.trim());
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') {
                            onChunk({ content: '', done: true });
                            return;
                        }
                        
                        try {
                            const parsed = JSON.parse(data);
                            const content = parsed.choices?.[0]?.delta?.content;
                            
                            if (content) {
                                onChunk({
                                    content: content,
                                    done: false,
                                });
                            }
                        } catch (e) {
                            console.warn('Failed to parse OpenShift AI stream chunk:', e);
                        }
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }
    }

    async loadContext(): Promise<string> {
        try {
            const response = await fetch(griotConfig.context.filePath);
            if (!response.ok) {
                console.warn('Context file not found, using default context');
                return this.getDefaultContext();
            }
            return await response.text();
        } catch (error) {
            console.warn('Failed to load context file, using default context:', error);
            return this.getDefaultContext();
        }
    }

    private getDefaultContext(): string {
        return `You are The Griot, a wise keeper of stories and oral history for the Griot and Grits project. 

Your role is to:
- Help visitors explore and discover stories in our oral history collection
- Provide guidance on finding specific types of narratives (resilience, heritage, community leadership, etc.)
- Answer questions about the stories and experiences preserved in our archive
- Connect people to relevant videos based on their interests

When you don't know something or can't find relevant information in the collection, you should honestly say so rather than making up information.

You speak with wisdom, warmth, and respect for the stories and people you represent. You understand the importance of preserving Black history and experiences for future generations.`;
    }

    createSystemMessage(context: string, userQuery: string): ChatMessage {
        return {
            role: 'system',
            content: `${context}

The user is asking: "${userQuery}"

Please provide a helpful response that either:
1. Guides them to relevant stories/videos in our collection
2. Answers their question based on the available context
3. Honestly states that you don't have enough information if that's the case

Remember to stay in character as The Griot and be helpful while being honest about limitations.`
        };
    }
}

export const griotLLM = new GriotLLMService();