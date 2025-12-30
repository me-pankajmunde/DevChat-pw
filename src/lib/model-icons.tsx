import { Brain, ChatCircleDots, Cpu, Lightning, Sparkle, Robot } from '@phosphor-icons/react'

export function getModelIcon(model?: string) {
  if (!model) {
    return <Robot weight="duotone" className="h-6 w-6" />
  }

  const modelLower = model.toLowerCase()

  if (modelLower.includes('gpt-4o')) {
    return <Sparkle weight="duotone" className="h-6 w-6" />
  }
  
  if (modelLower.includes('gpt-4')) {
    return <Brain weight="duotone" className="h-6 w-6" />
  }
  
  if (modelLower.includes('gpt-3.5')) {
    return <Lightning weight="duotone" className="h-6 w-6" />
  }
  
  if (modelLower.includes('claude')) {
    return <ChatCircleDots weight="duotone" className="h-6 w-6" />
  }
  
  if (modelLower.includes('llama') || modelLower.includes('mistral') || modelLower.includes('gemma')) {
    return <Cpu weight="duotone" className="h-6 w-6" />
  }

  return <Robot weight="duotone" className="h-6 w-6" />
}

export function getModelColor(model?: string) {
  if (!model) {
    return 'text-muted-foreground'
  }

  const modelLower = model.toLowerCase()

  if (modelLower.includes('gpt-4o')) {
    return 'text-accent'
  }
  
  if (modelLower.includes('gpt-4')) {
    return 'text-primary'
  }
  
  if (modelLower.includes('gpt-3.5')) {
    return 'text-chart-4'
  }
  
  if (modelLower.includes('claude')) {
    return 'text-chart-2'
  }
  
  if (modelLower.includes('llama') || modelLower.includes('mistral') || modelLower.includes('gemma')) {
    return 'text-chart-5'
  }

  return 'text-muted-foreground'
}
