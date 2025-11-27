"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react'

interface AnalysisResult {
  diagnosis: string
  confidence: number
  advice: string
}

interface AnalysisInput {
  ALT: string
  AST: string
  Bilirubin: string
  GGT: string
  Age: string
  Gender: string
  AlkPhos: string
  TP: string
  ALB: string
}

interface AnalysisContextType {
  result: AnalysisResult | null
  input: AnalysisInput | null
  setResult: (result: AnalysisResult | null) => void
  setInput: (input: AnalysisInput | null) => void
  reset: () => void
  resetAll: () => void
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined)

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [input, setInput] = useState<AnalysisInput | null>(null)

  const reset = () => {
    setResult(null)
    setInput(null)
  }

  const resetAll = () => {
    setResult(null)
    setInput(null)
    // Additional reset logic can be added here if needed
  }

  return (
    <AnalysisContext.Provider value={{ result, input, setResult, setInput, reset, resetAll }}>
      {children}
    </AnalysisContext.Provider>
  )
}

export function useAnalysis() {
  const context = useContext(AnalysisContext)
  if (context === undefined) {
    throw new Error('useAnalysis must be used within an AnalysisProvider')
  }
  return context
}