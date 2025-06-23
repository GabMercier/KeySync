"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Music, ArrowUp, ArrowDown, RotateCcw, Minus, Plus } from "lucide-react"

const camelotKeysMinor = ["12A", "1A", "2A", "3A", "4A", "5A", "6A", "7A", "8A", "9A", "10A", "11A"]

const camelotKeysMajor = ["12B", "1B", "2B", "3B", "4B", "5B", "6B", "7B", "8B", "9B", "10B", "11B"]

const camelotKeys = [
  "1A",
  "2A",
  "3A",
  "4A",
  "5A",
  "6A",
  "7A",
  "8A",
  "9A",
  "10A",
  "11A",
  "12A",
  "1B",
  "2B",
  "3B",
  "4B",
  "5B",
  "6B",
  "7B",
  "8B",
  "9B",
  "10B",
  "11B",
  "12B",
]

// Camelot wheel data with more muted colors
const wheelData = {
  "12B": { color: "#4A9B9B", musicalKey: "E", type: "major" },
  "1B": { color: "#4A9B7A", musicalKey: "B", type: "major" },
  "2B": { color: "#6B9B4A", musicalKey: "F#", type: "major" },
  "3B": { color: "#8B9B4A", musicalKey: "Db", type: "major" },
  "4B": { color: "#B8A84A", musicalKey: "Ab", type: "major" },
  "5B": { color: "#B8864A", musicalKey: "Eb", type: "major" },
  "6B": { color: "#B8644A", musicalKey: "Bb", type: "major" },
  "7B": { color: "#B84A7A", musicalKey: "F", type: "major" },
  "8B": { color: "#9B4A9B", musicalKey: "C", type: "major" },
  "9B": { color: "#7A4A9B", musicalKey: "G", type: "major" },
  "10B": { color: "#5A6B9B", musicalKey: "D", type: "major" },
  "11B": { color: "#4A8B9B", musicalKey: "A", type: "major" },
  "12A": { color: "#3A7A7A", musicalKey: "Db", type: "minor" },
  "1A": { color: "#4A8A5A", musicalKey: "Ab", type: "minor" },
  "2A": { color: "#5A8A4A", musicalKey: "Eb", type: "minor" },
  "3A": { color: "#7A8A4A", musicalKey: "Bb", type: "minor" },
  "4A": { color: "#9A8A4A", musicalKey: "F", type: "minor" },
  "5A": { color: "#9A6A4A", musicalKey: "C", type: "minor" },
  "6A": { color: "#9A5A4A", musicalKey: "G", type: "minor" },
  "7A": { color: "#9A4A6A", musicalKey: "D", type: "minor" },
  "8A": { color: "#8A4A8A", musicalKey: "A", type: "minor" },
  "9A": { color: "#6A4A8A", musicalKey: "E", type: "minor" },
  "10A": { color: "#5A5A8A", musicalKey: "B", type: "minor" },
  "11A": { color: "#4A7A8A", musicalKey: "F#", type: "minor" },
}

// Utility to detect browser-only APIs safely
const isBrowser = typeof window !== "undefined"

const getContrastColor = (hexColor: string): string => {
  // Convert hex to RGB
  const r = Number.parseInt(hexColor.slice(1, 3), 16)
  const g = Number.parseInt(hexColor.slice(3, 5), 16)
  const b = Number.parseInt(hexColor.slice(5, 7), 16)

  // Calculate relative luminance using the WCAG formula
  const getLuminance = (c: number) => {
    c = c / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  }

  const luminance = 0.2126 * getLuminance(r) + 0.7152 * getLuminance(g) + 0.0722 * getLuminance(b)

  // Use a lower threshold to prefer white text more often for better readability
  return luminance > 0.4 ? "#000000" : "#ffffff"
}

interface MatchResult {
  original: {
    key: string
    bpm_range: [number, number]
    pitched_up_becomes: string
    pitched_down_becomes: string
  }
  perfect_matches: Array<{
    key: string
    bpm_range: [number, number]
    type: string
    description: string
  }>
  good_matches: Array<{
    key: string
    bpm_range: [number, number]
    type: string
    description: string
  }>
  advanced_matches: Array<{
    key: string
    bpm_range: [number, number]
    type: string
    description: string
  }>
  pitch_up_choices: Array<{
    original_key: string
    bpm: number
    becomes_key: string
    match_type: string
  }>
  pitch_down_choices: Array<{
    original_key: string
    bpm: number
    becomes_key: string
    match_type: string
  }>
}

export default function DJHarmonicMatcher() {
  const [selectedKey, setSelectedKey] = useState("")
  const [bpm, setBpm] = useState(120)
  const [matches, setMatches] = useState<MatchResult | null>(null)
  const [activeTab, setActiveTab] = useState("perfect")
  const [mobileScreen, setMobileScreen] = useState<"selection" | "results">("selection")

  // Check if mobile
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1600)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const shiftKey = (key: string, semitones: number): string => {
    const idx = camelotKeys.indexOf(key)
    if (idx === -1) return key
    const shiftSteps = semitones * 7
    return camelotKeys[(idx + shiftSteps + 24) % 24]
  }

  const calculatePitchShift = (bpm: number, semitones: number): number => {
    const factor = Math.pow(2, semitones / 12)
    return Math.round(bpm * factor * 100) / 100
  }

  const bpmRange = (bpm: number, percent = 2.97): [number, number] => {
    const lower = Math.round(bpm * (1 - percent / 100) * 100) / 100
    const upper = Math.round(bpm * (1 + percent / 100) * 100) / 100
    return [lower, upper]
  }

  const generateMatches = (key: string, bpmValue: number): MatchResult => {
    const keyNumber = Number.parseInt(key.slice(0, -1))
    const keyLetter = key.slice(-1)

    // Helper function to create key from number and letter
    const makeKey = (num: number, letter: string) => {
      const normalizedNum = ((num - 1 + 12) % 12) + 1
      return `${normalizedNum}${letter}`
    }

    // Perfect matches
    const perfectMatches = [
      {
        key: key,
        bpm_range: bpmRange(bpmValue),
        type: "Same Key",
        description: "Perfect match - same key",
      },
      {
        key: `${keyNumber}${keyLetter === "A" ? "B" : "A"}`,
        bpm_range: bpmRange(bpmValue),
        type: "Relative",
        description: keyLetter === "A" ? "Relative major" : "Relative minor",
      },
    ]

    // Good matches (adjacent keys)
    const goodMatches = [
      {
        key: makeKey(keyNumber - 1, keyLetter),
        bpm_range: bpmRange(bpmValue),
        type: "Adjacent",
        description: "Adjacent key (-1)",
      },
      {
        key: makeKey(keyNumber + 1, keyLetter),
        bpm_range: bpmRange(bpmValue),
        type: "Adjacent",
        description: "Adjacent key (+1)",
      },
      {
        key: `${keyNumber}${keyLetter === "A" ? "B" : "A"}`,
        bpm_range: bpmRange(bpmValue),
        type: "Same Root",
        description: keyLetter === "A" ? "Same root note (minor to major)" : "Same root note (major to minor)",
      },
      {
        key: keyLetter === "B" ? makeKey(keyNumber + 1, "A") : makeKey(keyNumber - 1, "B"),
        bpm_range: bpmRange(bpmValue),
        type: "Diagonal",
        description: keyLetter === "B" ? "Diagonal mixing (B to A: +1)" : "Diagonal mixing (A to B: -1)",
      },
    ]

    const advancedMatches = [
      {
        key: makeKey(keyNumber - 7, keyLetter),
        bpm_range: bpmRange(bpmValue),
        type: "Perfect Fifth",
        description: "Perfect fifth down",
      },
      {
        key: makeKey(keyNumber + 7, keyLetter),
        bpm_range: bpmRange(bpmValue),
        type: "Perfect Fifth",
        description: "Perfect fifth up",
      },
      {
        key: makeKey(keyNumber + 4, keyLetter),
        bpm_range: bpmRange(bpmValue),
        type: "Related",
        description: "Related key (+4)",
      },
      {
        // Advanced harmonic mixing: A keys go +3 and switch to B, B keys go -3 and switch to A
        key:
          keyLetter === "A"
            ? makeKey(keyNumber + 3, "B") // A keys: +3 and switch to B
            : makeKey(keyNumber - 3, "A"), // B keys: -3 and switch to A
        bpm_range: bpmRange(bpmValue),
        type: "Advanced Mix",
        description: "Advanced harmonic mixing (+3 cross-mode)",
      },
      {
        key: makeKey(keyNumber - 2, keyLetter),
        bpm_range: bpmRange(bpmValue),
        type: "Energy Drop",
        description: "Energy drop (-2 for energy drop)",
      },
    ]

    // All compatible keys (perfect + good + advanced matches)
    const allCompatibleKeys = [...perfectMatches, ...goodMatches, ...advancedMatches]

    // Add energy boost matches only for pitch shifting (not in regular matches)
    const energyBoostMatches = [
      {
        key: makeKey(keyNumber + 7, keyLetter),
        bpm_range: bpmRange(calculatePitchShift(bpmValue, 1)),
        type: "Energy Boost",
        description: "Energy boost (+7 for 1 semitone)",
      },
      {
        key: makeKey(keyNumber + 2, keyLetter),
        bpm_range: bpmRange(calculatePitchShift(bpmValue, 2)),
        type: "Energy Boost",
        description: "Energy boost (+2 for 2 semitones)",
      },
    ]

    // All compatible keys including energy boosts for pitch calculations
    const allCompatibleKeysWithEnergyBoost = [...allCompatibleKeys, ...energyBoostMatches]

    // Generate pitch up choices - keys that when pitched up become compatible
    const pitchUpChoicesMap = new Map<
      string,
      { original_key: string; bpm: number; becomes_key: string; match_types: string[] }
    >()

    allCompatibleKeysWithEnergyBoost.forEach((match) => {
      const originalKey = shiftKey(match.key, -1)
      const bpm = calculatePitchShift(bpmValue, -1)
      const key = `${originalKey}-${match.key}`

      if (pitchUpChoicesMap.has(key)) {
        pitchUpChoicesMap.get(key)!.match_types.push(match.type)
      } else {
        pitchUpChoicesMap.set(key, {
          original_key: originalKey,
          bpm: bpm,
          becomes_key: match.key,
          match_types: [match.type],
        })
      }
    })

    const pitchUpChoices = Array.from(pitchUpChoicesMap.values()).map((choice) => ({
      ...choice,
      match_type: choice.match_types.join(" or "),
    }))

    // Generate pitch down choices - keys that when pitched down become compatible
    const pitchDownChoicesMap = new Map<
      string,
      { original_key: string; bpm: number; becomes_key: string; match_types: string[] }
    >()

    allCompatibleKeysWithEnergyBoost.forEach((match) => {
      const originalKey = shiftKey(match.key, 1)
      const bpm = calculatePitchShift(bpmValue, 1)
      const key = `${originalKey}-${match.key}`

      if (pitchDownChoicesMap.has(key)) {
        pitchDownChoicesMap.get(key)!.match_types.push(match.type)
      } else {
        pitchDownChoicesMap.set(key, {
          original_key: originalKey,
          bpm: bpm,
          becomes_key: match.key,
          match_types: [match.type],
        })
      }
    })

    const pitchDownChoices = Array.from(pitchDownChoicesMap.values()).map((choice) => ({
      ...choice,
      match_type: choice.match_types.join(" or "),
    }))

    return {
      original: {
        key: key,
        bpm_range: bpmRange(bpmValue),
        pitched_up_becomes: shiftKey(key, 1),
        pitched_down_becomes: shiftKey(key, -1),
      },
      perfect_matches: perfectMatches,
      good_matches: goodMatches,
      advanced_matches: advancedMatches,
      pitch_up_choices: pitchUpChoices,
      pitch_down_choices: pitchDownChoices,
    }
  }

  const handleKeySelect = (key: string) => {
    console.log("Key selected:", key)
    setSelectedKey(key)
    if (key && bpm) {
      const result = generateMatches(key, bpm)
      setMatches(result)
      // Auto-navigate to results on mobile when a key is selected
      if (isMobile) {
        setMobileScreen("results")
      }
    }
  }

  const handleBpmChange = (newBpm: number) => {
    setBpm(newBpm)
    if (selectedKey && newBpm) {
      const result = generateMatches(selectedKey, newBpm)
      setMatches(result)
    }
  }

  const adjustBpm = (delta: number) => {
    const newBpm = Math.max(60, Math.min(200, bpm + delta))
    handleBpmChange(newBpm)
  }

  const reset = () => {
    setSelectedKey("")
    setBpm(120)
    setMatches(null)
    if (isMobile) {
      setMobileScreen("selection")
    }
  }

  const createKeyButtons = (keys: string[], radius: number) => {
    return keys.map((key, index) => {
      const angle = (index / keys.length) * 360 - 90
      const rad = angle * (Math.PI / 180)
      const x = radius * Math.cos(rad)
      const y = radius * Math.sin(rad)
      const isSelected = selectedKey === key
      const data = wheelData[key as keyof typeof wheelData]

      // Calculate button size based on screen size and prevent overlap
      // For very small screens (375px), ensure good touch targets
      // For very large screens, make buttons bigger with proper proportions
      const getButtonSize = () => {
        if (!isBrowser) return 45 // fallback when rendering on the server
        const screenWidth = window.innerWidth

        if (screenWidth <= 375) {
          return Math.min(screenWidth * 0.08, 35)
        } else if (screenWidth >= 1920) {
          return Math.min(screenWidth * 0.035, 65)
        } else if (isMobile) {
          return Math.min(screenWidth * 0.09, 50)
        } else {
          const isOuterCircle = keys === camelotKeysMajor
          return isOuterCircle ? Math.min(screenWidth * 0.04, 55) : Math.min(screenWidth * 0.03, 45)
        }
      }

      const buttonSize = getButtonSize()

      return (
        <Button
          key={key}
          onClick={() => handleKeySelect(key)}
          style={{
            position: "absolute",
            left: `calc(50% + ${x}px)`,
            top: `calc(50% + ${y}px)`,
            transform: "translate(-50%, -50%)",
            backgroundColor: isSelected ? data.color : `${data.color}60`,
            boxShadow: isSelected ? `0 0 15px ${data.color}60` : undefined,
            zIndex: isSelected ? 10 : 1,
            width: `${buttonSize}px`,
            height: `${buttonSize}px`,
          }}
          className={`rounded-full text-xs font-bold border-2 transition-all duration-200 ${
            isSelected
              ? "border-white text-white scale-110 shadow-lg"
              : "border-white/30 text-white hover:border-white/60 hover:scale-105 hover:shadow-md"
          }`}
        >
          <div className="flex flex-col items-center justify-center">
            <span className="font-bold text-xs">{key}</span>
            <span className="opacity-70 text-[8px]">{data.musicalKey}</span>
          </div>
        </Button>
      )
    })
  }

  const renderMatchList = (matches: any[], colorClass: string) => {
    const bpmRange = matches.length > 0 ? matches[0].bpm_range : null

    return (
      <div className="h-full flex flex-col">
        {bpmRange && (
          <div className="text-center flex-shrink-0 mb-3">
            <p className="text-white text-lg font-semibold">
              {bpmRange[0]} - {bpmRange[1]} BPM
            </p>
          </div>
        )}
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-2">
            {matches.map((match, index) => (
              <div key={index} className="flex flex-wrap items-center gap-2 p-2 bg-white/5 rounded">
                <Badge
                  className="text-white border-0"
                  style={{
                    backgroundColor: wheelData[match.key as keyof typeof wheelData]?.color,
                    color: getContrastColor(wheelData[match.key as keyof typeof wheelData]?.color || "#000000"),
                  }}
                >
                  {match.key}
                </Badge>
                <span className="text-gray-300 text-xs">• {match.description}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderPitchChoices = (choices: any[], colorClass: string, direction: string) => {
    // Get the first choice to show the tempo conversion
    const firstChoice = choices[0]
    const tempoConversion = firstChoice ? `${firstChoice.bpm} → ${bpm}` : ""

    return (
      <div className="h-full flex flex-col">
        <div className="text-center flex-shrink-0 mb-3">
          <p className="text-white text-lg font-semibold">{tempoConversion}</p>
          <p className="text-gray-300 text-xs">
            Find songs in these keys and pitch them {direction} ({direction === "UP" ? "+5.95%" : "-5.95%"}) to match:
          </p>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-2">
            {choices.map((choice, index) => (
              <div key={index} className="flex flex-wrap items-center gap-2 p-2 bg-white/5 rounded">
                <Badge
                  className="text-white border-0"
                  style={{
                    backgroundColor: wheelData[choice.original_key as keyof typeof wheelData]?.color,
                    color: getContrastColor(
                      wheelData[choice.original_key as keyof typeof wheelData]?.color || "#000000",
                    ),
                  }}
                >
                  {choice.original_key}
                </Badge>
                <span className="text-gray-300 text-xs">→</span>
                <Badge
                  className="text-white border-0"
                  style={{
                    backgroundColor: wheelData[choice.becomes_key as keyof typeof wheelData]?.color,
                    color: getContrastColor(
                      wheelData[choice.becomes_key as keyof typeof wheelData]?.color || "#000000",
                    ),
                  }}
                >
                  {choice.becomes_key}
                </Badge>
                <span className="text-gray-300 text-xs">({choice.match_type})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const handleSliderDoubleClick = () => {
    handleBpmChange(120)
  }

  const SelectionScreen = () => (
    <Card className="bg-white/5 backdrop-blur-sm border-white/10 h-full flex flex-col">
      <CardHeader className="pb-4 flex-shrink-0">
        <CardTitle className="text-white text-base">Select Key & BPM</CardTitle>
        <CardDescription className="text-gray-300 text-xs">
          Click on any key button to select it, adjust BPM in the center
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 flex flex-col items-center justify-center p-4">
        <div className="w-full h-full flex items-center justify-center">
          <div
            className="relative flex items-center justify-center"
            style={{
              width: isMobile ? "min(85vw, 85vh, 350px)" : "min(60vw, 60vh, 600px)",
              height: isMobile ? "min(85vw, 85vh, 350px)" : "min(60vw, 60vh, 600px)",
            }}
          >
            {/* Major keys outer ring */}
            {createKeyButtons(camelotKeysMajor, getRadius(true))}

            {/* Minor keys inner ring */}
            {createKeyButtons(camelotKeysMinor, getRadius(false))}

            {/* BPM selector at center */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="bg-gray-900/95 rounded-full border-2 border-white/20 p-3"
                style={{
                  width: isMobile ? `min(22vw, 22vh, 120px)` : `min(15vw, 15vh, 140px)`,
                  height: isMobile ? `min(22vw, 22vh, 120px)` : `min(15vw, 15vh, 140px)`,
                }}
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="flex items-center gap-1 mb-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => adjustBpm(-1)}
                      className="text-white hover:bg-white/10 w-5 h-5"
                    >
                      <Minus className="w-2 h-2" />
                    </Button>
                    <span className="text-white font-bold tabular-nums text-xl">{bpm}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => adjustBpm(1)}
                      className="text-white hover:bg-white/10 w-5 h-5"
                    >
                      <Plus className="w-2 h-2" />
                    </Button>
                  </div>
                  <div className="w-full px-1 mb-1" onDoubleClick={handleSliderDoubleClick}>
                    <Slider
                      value={[bpm]}
                      onValueChange={(value) => handleBpmChange(value[0])}
                      max={200}
                      min={60}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  <span className="text-white/70 font-medium text-xs">BPM</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {selectedKey && (
          <div
            className="p-3 rounded-lg border mb-4 w-full bg-white/5 flex-shrink-0"
            style={{
              borderColor: `${wheelData[selectedKey as keyof typeof wheelData]?.color}40`,
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4" style={{ color: wheelData[selectedKey as keyof typeof wheelData]?.color }} />
                <span className="text-white font-semibold">Original Key</span>
              </div>
              <Button onClick={reset} size="icon" variant="ghost" className="text-white hover:bg-white/10 w-8 h-8">
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                className="text-white border-0"
                style={{
                  backgroundColor: wheelData[selectedKey as keyof typeof wheelData]?.color,
                  color: getContrastColor(wheelData[selectedKey as keyof typeof wheelData]?.color || "#000000"),
                }}
              >
                {selectedKey}
              </Badge>
              <span className="text-white text-sm">
                {matches?.original.bpm_range[0]} - {matches?.original.bpm_range[1]} BPM
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )

  const ResultsScreen = () => (
    <Card className="bg-white/5 backdrop-blur-sm border-white/10 h-full flex flex-col">
      <CardHeader className="pb-4 flex-shrink-0">
        <CardTitle className="text-white">Harmonic Matches</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-5 bg-white/10 flex-shrink-0">
            <TabsTrigger value="perfect" className="text-xs data-[state=active]:bg-white/20 text-white">
              Perfect
            </TabsTrigger>
            <TabsTrigger value="good" className="text-xs data-[state=active]:bg-white/20 text-white">
              Good
            </TabsTrigger>
            <TabsTrigger value="advanced" className="text-xs data-[state=active]:bg-white/20 text-white">
              Advanced
            </TabsTrigger>
            <TabsTrigger value="pitch-up" className="text-xs data-[state=active]:bg-white/20 text-white">
              <ArrowUp className="w-3 h-3" />
            </TabsTrigger>
            <TabsTrigger value="pitch-down" className="text-xs data-[state=active]:bg-white/20 text-white">
              <ArrowDown className="w-3 h-3" />
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 mt-4 min-h-0">
            <TabsContent value="perfect" className="h-full m-0 data-[state=inactive]:hidden">
              <div className="bg-white/5 p-4 rounded-lg border border-white/10 h-full flex flex-col">
                <div className="flex items-center gap-2 mb-3 flex-shrink-0">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span className="text-white font-semibold">Perfect Matches</span>
                </div>
                <div className="flex-1 min-h-0">
                  {matches && renderMatchList(matches.perfect_matches, "text-gray-300")}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="good" className="h-full m-0 data-[state=inactive]:hidden">
              <div className="bg-white/5 p-4 rounded-lg border border-white/10 h-full flex flex-col">
                <div className="flex items-center gap-2 mb-3 flex-shrink-0">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <span className="text-white font-semibold">Good Matches</span>
                </div>
                <div className="flex-1 min-h-0">
                  {matches && renderMatchList(matches.good_matches, "text-gray-300")}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="h-full m-0 data-[state=inactive]:hidden">
              <div className="bg-white/5 p-4 rounded-lg border border-white/10 h-full flex flex-col">
                <div className="flex items-center gap-2 mb-3 flex-shrink-0">
                  <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                  <span className="text-white font-semibold">Advanced Matches</span>
                </div>
                <div className="flex-1 min-h-0">
                  {matches && renderMatchList(matches.advanced_matches, "text-gray-300")}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="pitch-up" className="h-full m-0 data-[state=inactive]:hidden">
              <div className="bg-white/5 p-4 rounded-lg border border-white/10 h-full flex flex-col">
                <div className="flex items-center gap-2 mb-3 flex-shrink-0">
                  <ArrowUp className="w-4 h-4 text-orange-400" />
                  <span className="text-white font-semibold">Pitch UP Options</span>
                </div>
                <div className="flex-1 min-h-0">
                  {matches && renderPitchChoices(matches.pitch_up_choices, "text-gray-300", "UP")}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="pitch-down" className="h-full m-0 data-[state=inactive]:hidden">
              <div className="bg-white/5 p-4 rounded-lg border border-white/10 h-full flex flex-col">
                <div className="flex items-center gap-2 mb-3 flex-shrink-0">
                  <ArrowDown className="w-4 h-4 text-blue-400" />
                  <span className="text-white font-semibold">Pitch DOWN Options</span>
                </div>
                <div className="flex-1 min-h-0">
                  {matches && renderPitchChoices(matches.pitch_down_choices, "text-gray-300", "DOWN")}
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  )

  // Calculate radius with better proportions for large screens
  const getRadius = (isOuter: boolean) => {
    // Provide safe defaults during static prerender
    const width = isBrowser ? window.innerWidth : 1280
    const height = isBrowser ? window.innerHeight : 720

    const containerSize = isMobile
      ? Math.min(width * 0.85, height * 0.85, 350)
      : Math.min(width * 0.6, height * 0.6, 600)

    if (width >= 1920) {
      return containerSize * (isOuter ? 0.45 : 0.25)
    }
    return containerSize * (isOuter ? 0.42 : 0.27)
  }

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden flex flex-col">
      <div className="max-w-7xl mx-auto h-full flex flex-col px-2 py-4">
        {/* Title in top left corner */}
        <div className="absolute top-4 left-4 z-10">
          <div className="flex items-center gap-2"></div>
        </div>

        <div className="max-w-7xl mx-auto h-full flex flex-col pt-[10] pb-2.5">
          {/* Desktop Layout */}
          {!isMobile && (
            <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6 h-full min-h-0 py-4 px-4">
              {SelectionScreen()}
              {matches && ResultsScreen()}
            </div>
          )}

          {/* Mobile Layout */}
          {isMobile && (
            <div className="h-full flex flex-col min-h-0">
              {/* Mobile Navigation */}
              <div className="flex justify-center mb-4 flex-shrink-0">
                <div className="flex bg-white/10 rounded-lg p-1">
                  <Button
                    variant={mobileScreen === "selection" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setMobileScreen("selection")}
                  >
                    Selection
                  </Button>
                  <Button
                    variant={mobileScreen === "results" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setMobileScreen("results")}
                  >
                    Results
                  </Button>
                </div>
              </div>

              {/* Mobile Content */}
              <div className="flex-1 min-h-0">
                {mobileScreen === "selection" && SelectionScreen()}
                {mobileScreen === "results" && matches && ResultsScreen()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
