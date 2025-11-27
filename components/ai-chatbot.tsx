"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Bot, User, Search, Download, Trash2, MessageSquare } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from 'sonner'
import { Badge } from "@/components/ui/badge"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export function AiChatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I am your intelligent medical assistant. How can I help you today?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [maxMessages, setMaxMessages] = useState(20)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Function to detect if text contains Arabic characters
  const isArabic = (text: string) => {
    const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/
    return arabicRegex.test(text)
  }

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }

  useEffect(() => {
    // Use setTimeout to ensure DOM is updated
    const timeoutId = setTimeout(scrollToBottom, 100)
    return () => clearTimeout(timeoutId)
  }, [messages])

  const filteredMessages = messages
    .filter(message => message.content.toLowerCase().includes(searchQuery.toLowerCase()))
    .slice(-maxMessages) // Show only the most recent messages

  const hasMoreMessages = messages.length > maxMessages && !searchQuery

  const loadMoreMessages = () => {
    setMaxMessages(prev => prev + 20)
  }

  const exportChat = () => {
    const chatContent = messages.map(msg =>
      `[${msg.timestamp.toLocaleString()}] ${msg.role.toUpperCase()}: ${msg.content}`
    ).join('\n\n')

    const blob = new Blob([chatContent], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `medical-chat-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success("Chat exported successfully!")
  }

  const clearChat = () => {
    setMessages([{
      id: "1",
      role: "assistant",
      content: "Hello! I am your intelligent medical assistant. How can I help you today?",
      timestamp: new Date(),
    }])
    toast.success("Chat cleared!")
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    // Prevent multiple simultaneous requests
    if (isLoading) {
      return
    }

    const userMessageId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const userMessage: Message = {
      id: userMessageId,
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    }

    // Add user message first, then clear input
    setMessages((prev) => [...prev, userMessage])
    const currentInput = input
    setInput("")
    setIsLoading(true)

    // Create AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    try {
      console.log("Frontend: Making request to /api/chatbot with message:", currentInput)

      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: currentInput }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      console.log("Frontend: Response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text().catch(() => '')
        console.log("Frontend: Error response text:", errorText)

        let errorMessage = `HTTP ${response.status}`

        try {
          const errorData = JSON.parse(errorText)
          console.log("Frontend: Parsed error data:", errorData)
          errorMessage = errorData.error || errorMessage
          if (errorData.details && process.env.NODE_ENV === 'development') {
            errorMessage += ` (${errorData.details})`
          }
        } catch (parseError) {
          console.log("Frontend: Could not parse error as JSON:", parseError)
          // If not JSON, use the raw text or status
          if (errorText) {
            errorMessage = errorText
          }
        }

        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log("Frontend: Success response:", data)

      if (!data.success || !data.response) {
        throw new Error("Invalid response format from server")
      }

      const assistantMessageId = `assistant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Chat error:", error)

      let errorMessage = "Unknown error occurred"
      let shouldRestoreInput = false

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = "Request timed out. Please try again."
          shouldRestoreInput = true
        } else {
          errorMessage = error.message
        }
      }

      toast.error("Chat Error", {
        description: errorMessage,
      })

      // Restore input if it was a timeout or network error
      if (shouldRestoreInput) {
        setInput(currentInput)
      }

      const assistantErrorMessageId = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const assistantErrorMessage: Message = {
        id: assistantErrorMessageId,
        role: "assistant",
        content: `Sorry, I encountered an error: ${errorMessage}. Please try again.`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantErrorMessage])
    } finally {
      clearTimeout(timeoutId)
      setIsLoading(false)
    }
  }

  return (
    <Card className="flex h-[600px] flex-col bg-white/90 backdrop-blur-md border border-white/30 shadow-2xl animate-in fade-in-0 duration-500 hover-lift hover:shadow-3xl transition-all duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary animate-glow">
              <Bot className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="gradient-text text-xl">AI Medical Assistant</CardTitle>
              <CardDescription className="text-muted-foreground/80">Intelligent medical Q&A chatbot</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gradient-card">
              {filteredMessages.length} / {messages.length - 1} messages
            </Badge>
            <Button variant="outline" size="sm" onClick={exportChat} className="rounded-xl">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={clearChat} className="rounded-xl">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-xl border-border/50 bg-background/50"
          />
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4 p-0 min-h-0">
        <ScrollArea ref={scrollAreaRef} className="flex-1 px-6 bg-gradient-to-b from-gray-50/30 to-white/50 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 min-h-0">
          <div className="space-y-4 pb-4 min-h-full">
            {filteredMessages.length === 0 && searchQuery ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No messages found matching your search.</p>
              </div>
            ) : (
              filteredMessages.map((message, index) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : "flex-row"} ${index > 10 ? '' : 'animate-in slide-in-from-bottom-2 duration-300'}`}
                  style={index <= 10 ? { animationDelay: `${Math.min(index * 50, 500)}ms` } : {}}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      message.role === "user" ? "gradient-primary" : "bg-gradient-to-br from-blue-500 to-purple-500"
                    }`}
                  >
                    {message.role === "user" ? (
                      <User className="h-4 w-4 text-primary-foreground" />
                    ) : (
                      <Bot className="h-4 w-4 text-white" />
                    )}
                  </div>
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <div
                      className={`rounded-2xl px-4 py-3 shadow-sm break-words max-w-none ${
                        message.role === "user"
                          ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white ml-12"
                          : "bg-background/80 text-foreground mr-12"
                      } ${isArabic(message.content) ? "text-right" : "text-left"}`}
                      dir={isArabic(message.content) ? "rtl" : "ltr"}
                    >
                      <div className={`text-sm leading-relaxed whitespace-pre-line overflow-wrap-anywhere ${isArabic(message.content) ? "text-right" : "text-left"}`}>
                        {message.content}
                      </div>
                    </div>
                    <p className={`text-xs text-muted-foreground ${message.role === "user" ? "text-right mr-2" : "text-left ml-2"}`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
            {hasMoreMessages && (
              <div className="flex justify-center py-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadMoreMessages}
                  className="rounded-xl"
                >
                  Load {Math.min(20, messages.length - maxMessages)} More Messages
                </Button>
              </div>
            )}
            {isLoading && (
              <div className="flex gap-3 animate-in slide-in-from-bottom-2 duration-300">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="flex items-center gap-1 rounded-2xl gradient-card px-4 py-3 shadow-sm">
                  <div className="h-3 w-3 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
                  <div className="h-3 w-3 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
                  <div className="h-3 w-3 animate-bounce rounded-full bg-primary" />
                  <span className="text-sm text-muted-foreground ml-2">AI is thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="border-t border-gray-200/50 p-4 bg-gradient-to-r from-gray-50/80 to-white/60 backdrop-blur-sm animate-in fade-in-0 duration-500 delay-200">
          <div className="flex gap-3">
            <Input
              placeholder="Ask me anything about medical conditions, symptoms, or health advice..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              disabled={isLoading}
              className="rounded-xl border-border/50 bg-background/50 focus:ring-2 focus:ring-primary/50"
            />
            <Button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              size="icon"
              className="rounded-xl gradient-primary hover-lift disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Press Enter to send • Shift+Enter for new line
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
