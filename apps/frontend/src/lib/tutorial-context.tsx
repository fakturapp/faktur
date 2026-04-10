'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { TUTORIAL_LEVELS, getLevel, type TutorialStep } from '@/components/tutorial/tutorial-steps'

const STORAGE_KEY = 'faktur_tutorial'
const OFFER_KEY = 'faktur_tutorial_offer'

interface TutorialState {
  active: boolean
  level: number
  step: number
}

interface TutorialContextType {
  active: boolean
  level: number
  step: number
  currentLevel: ReturnType<typeof getLevel>
  currentStep: TutorialStep | null
  totalLevels: number
  totalStepsInLevel: number
  showOffer: boolean
  showLevelComplete: boolean
  showTutorialComplete: boolean
  startTutorial: () => void
  quitTutorial: () => void
  nextStep: () => void
  prevStep: () => void
  skipLevel: () => void
  dismissOffer: () => void
  dismissLevelComplete: () => void
  dismissTutorialComplete: () => void
  openTutorialFromMenu: () => void
  goToLevel: (levelId: number) => void
}

const TutorialContext = createContext<TutorialContextType | null>(null)

export function useTutorial() {
  const ctx = useContext(TutorialContext)
  if (!ctx) throw new Error('useTutorial must be used within TutorialProvider')
  return ctx
}

export function useTutorialSafe() {
  return useContext(TutorialContext)
}

function loadState(): TutorialState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function saveState(state: TutorialState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function clearState() {
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem('faktur_tutorial_data')
}

export function TutorialProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  const [active, setActive] = useState(false)
  const [level, setLevel] = useState(1)
  const [step, setStep] = useState(0)
  const [showOffer, setShowOffer] = useState(false)
  const [showLevelComplete, setShowLevelComplete] = useState(false)
  const [showTutorialComplete, setShowTutorialComplete] = useState(false)

  useEffect(() => {
    const saved = loadState()
    if (saved?.active) {
      setActive(true)
      setLevel(saved.level)
      setStep(saved.step)
    }
    if (localStorage.getItem(OFFER_KEY) === 'pending') {
      setShowOffer(true)
    }
  }, [])

  useEffect(() => {
    if (active) {
      saveState({ active, level, step })
    }
  }, [active, level, step])

  const currentLevel = getLevel(level)
  const currentStep = currentLevel?.steps[step] ?? null
  const totalLevels = TUTORIAL_LEVELS.length
  const totalStepsInLevel = currentLevel?.steps.length ?? 0

  useEffect(() => {
    if (!active || !currentStep?.route) return
    if (pathname !== currentStep.route) {
      router.push(currentStep.route)
    }
  }, [active, currentStep?.route, currentStep?.id])

  const startTutorial = useCallback(() => {
    setActive(true)
    setLevel(1)
    setStep(0)
    setShowOffer(false)
    setShowLevelComplete(false)
    setShowTutorialComplete(false)
    localStorage.removeItem(OFFER_KEY)
    saveState({ active: true, level: 1, step: 0 })
    router.push('/dashboard')
  }, [router])

  const quitTutorial = useCallback(() => {
    setActive(false)
    setLevel(1)
    setStep(0)
    setShowLevelComplete(false)
    setShowTutorialComplete(false)
    clearState()
  }, [])

  const nextStep = useCallback(() => {
    if (!currentLevel) return

    if (step < currentLevel.steps.length - 1) {
      setStep((s) => s + 1)
    } else if (level < TUTORIAL_LEVELS.length) {
      setShowLevelComplete(true)
    } else {
      setShowTutorialComplete(true)
    }
  }, [step, level, currentLevel])

  const prevStep = useCallback(() => {
    if (step > 0) {
      setStep((s) => s - 1)
    } else if (level > 1) {
      const prevLevel = getLevel(level - 1)
      if (prevLevel) {
        setLevel(level - 1)
        setStep(prevLevel.steps.length - 1)
      }
    }
  }, [step, level])

  const skipLevel = useCallback(() => {
    if (level < TUTORIAL_LEVELS.length) {
      setShowLevelComplete(true)
    } else {
      setShowTutorialComplete(true)
    }
  }, [level])

  const dismissOffer = useCallback(() => {
    setShowOffer(false)
    localStorage.removeItem(OFFER_KEY)
  }, [])

  const dismissLevelComplete = useCallback(() => {
    setShowLevelComplete(false)
    if (level < TUTORIAL_LEVELS.length) {
      setLevel((l) => l + 1)
      setStep(0)
    } else {
      setShowTutorialComplete(true)
    }
  }, [level])

  const dismissTutorialComplete = useCallback(() => {
    setShowTutorialComplete(false)
    setActive(false)
    clearState()
    router.push('/dashboard')
  }, [router])

  const goToLevel = useCallback((levelId: number) => {
    const target = getLevel(levelId)
    if (!target) return
    setLevel(levelId)
    setStep(0)
    setShowLevelComplete(false)
    setShowTutorialComplete(false)
    if (!active) {
      setActive(true)
      setShowOffer(false)
      localStorage.removeItem(OFFER_KEY)
    }
  }, [active])

  const openTutorialFromMenu = useCallback(() => {
    setShowOffer(true)
  }, [])

  useEffect(() => {
    ;(window as any).__fakturTutorialOpen = openTutorialFromMenu
    return () => { delete (window as any).__fakturTutorialOpen }
  }, [openTutorialFromMenu])

  return (
    <TutorialContext.Provider
      value={{
        active,
        level,
        step,
        currentLevel,
        currentStep,
        totalLevels,
        totalStepsInLevel,
        showOffer,
        showLevelComplete,
        showTutorialComplete,
        startTutorial,
        quitTutorial,
        nextStep,
        prevStep,
        skipLevel,
        dismissOffer,
        dismissLevelComplete,
        dismissTutorialComplete,
        openTutorialFromMenu,
        goToLevel,
      }}
    >
      {children}
    </TutorialContext.Provider>
  )
}
