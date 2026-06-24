"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle2, BrainCircuit, XCircle, Info } from "lucide-react"

export function BehaviorPredictionForm() {
  const [selectedBehavior, setSelectedBehavior] = useState<string>("")
  const [acceleration, setAcceleration] = useState<string>("")
  
  // State for result with status (normal/abnormal/critical)
  const [result, setResult] = useState<{ status: "normal" | "abnormal" | "critical"; message: string } | null>(null)

  const handlePredict = () => {
    if (!selectedBehavior || !acceleration) return

    const accValue = parseFloat(acceleration)

    // --- 1. SPECIAL LOGIC FOR RESTING ---
    if (selectedBehavior === "resting") {
      if (accValue < 9.16) {
        setResult({
          status: "critical",
          message: "Critically Low (< 9.16): Strong deviation — sensor issue or atypical posture.",
        })
      } else if (accValue < 9.58) {
        setResult({
          status: "abnormal",
          message: "Low Abnormal (< 9.58): Possible sensor tilt, unusual posture, or cow not truly at rest.",
        })
      } else if (accValue > 10.84) {
        setResult({
          status: "critical",
          message: "Critically High (> 10.84): Significant movement — cow likely not resting.",
        })
      } else if (accValue > 10.42) {
        setResult({
          status: "abnormal",
          message: "High Abnormal (> 10.42): Subtle movement during supposed rest, restlessness, stress.",
        })
      } else {
        setResult({
          status: "normal",
          message: `Normal Behavior Detected. Based on "All Cows Resting" distribution, value is within Normal Range (~9.58 – 10.42 ACC_MAG).`,
        })
      }
      return
    }

    // --- 2. SPECIAL LOGIC FOR WALKING ---
    if (selectedBehavior === "walking") {
      if (accValue < 7.78) {
        setResult({
          status: "critical",
          message: "Critically Low (< 7.78): Severe gait abnormality — strong lameness indicator.",
        })
      } else if (accValue < 8.88) {
        setResult({
          status: "abnormal",
          message: "Low Abnormal (< 8.88): Unusually slow/sluggish gait — possible lameness, illness, or fatigue.",
        })
      } else if (accValue > 12.18) {
        setResult({
          status: "critical",
          message: "Critically High (> 12.18): Extreme agitation or panic — requires immediate attention.",
        })
      } else if (accValue > 11.08) {
        setResult({
          status: "abnormal",
          message: "High Abnormal (> 11.08): Unusually vigorous movement — agitation, stress, running, or pain response.",
        })
      } else {
        setResult({
          status: "normal",
          message: `Normal Behavior Detected. Based on "All Cows Walking" distribution, value is within Normal Range (~8.88 – 11.08 ACC_MAG).`,
        })
      }
      return
    }

    // --- 3. SPECIAL LOGIC FOR EATING ---
    if (selectedBehavior === "eating") {
      if (accValue < 5.0) {
        setResult({
          status: "critical",
          message: "Critically Low Intensity (< 5.0): Very little movement. Signals lethargy, resting, or standing without consuming.",
        })
      } else if (accValue < 5.44) {
        setResult({
          status: "abnormal",
          message: "Low Abnormal (< 5.44): Below optimal eating range. May indicate slow eating, pickiness, or reduced appetite.",
        })
      } else if (accValue > 15.0) {
        setResult({
          status: "critical",
          message: "Critically High Intensity (> 15.0): Excessive head movement. Aggressive behavior, distress, or non-eating activities.",
        })
      } else if (accValue > 14.72) {
        setResult({
          status: "abnormal",
          message: "High Abnormal (> 14.72): Above optimal eating range. May indicate rapid/competitive eating or mild restlessness.",
        })
      } else {
        setResult({
          status: "normal",
          message: `Normal Behavior Detected. Based on Collective Eating Behavior: The value is within the Optimal Range (5.44 – 14.72 ACC_MAG).`,
        })
      }
      return
    }

    // --- 4. SPECIAL LOGIC FOR MOUNTING ---
    if (selectedBehavior === "mounting") {
      if (accValue < 2.5) {
        setResult({
          status: "critical",
          message: "Low-Intensity Outlier (< 2.5): Very weak mounting attempts or 'mock' mounting with almost no acceleration.",
        })
      } else if (accValue < 2.73) {
        setResult({
          status: "abnormal",
          message: "Low Abnormal (< 2.73): Below the extended normal range. Likely a weak or failed mounting attempt.",
        })
      } else if (accValue > 18.0) {
        setResult({
          status: "critical",
          message: "High-Intensity Outlier (> 18.0): Highly aggressive interactions, slips, or sudden erratic movements.",
        })
      } else if (accValue > 17.85) {
        setResult({
          status: "abnormal",
          message: "High Abnormal (> 17.85): Intensity exceeds 95% of typical mounting activity. Potential aggression.",
        })
      } else {
        setResult({
          status: "normal",
          message: `Normal Behavior Detected. Based on Collective Mounting Behavior: Value is within the Extended Normal Range (2.73 – 17.85 ACC_MAG).`,
        })
      }
      return
    }

    // --- 5. SPECIAL LOGIC FOR RUMINATION (Added) ---
    if (selectedBehavior === "rumination") {
      if (accValue < 7.5) {
        setResult({
          status: "critical",
          message: "Low-Intensity Outlier (< 7.5): Very weak or interrupted rumination. Signals distress or frequent stops by external stimuli.",
        })
      } else if (accValue < 8.37) {
        setResult({
          status: "abnormal",
          message: "Low Abnormal (< 8.37): Below Core Normal Range (μ - 1σ). Irregular jaw movement or weak rhythm.",
        })
      } else if (accValue > 11.0) {
        setResult({
          status: "critical",
          message: "High-Intensity Outlier (> 11.0): Rare for rumination. Cow likely transitioned to active behavior (eating/walking).",
        })
      } else if (accValue > 9.83) {
        setResult({
          status: "abnormal",
          message: "High Abnormal (> 9.83): Above Core Normal Range (μ + 1σ). Unusually intense chewing or sensor noise.",
        })
      } else {
        setResult({
          status: "normal",
          message: `Normal Behavior Detected. Value is within the Core Normal Range (8.37 – 9.83 ACC_MAG), indicating healthy rhythmic activity.`,
        })
      }
      return
    }
  }

  const handleClear = () => {
    setResult(null)
    setAcceleration("")
    setSelectedBehavior("")
  }

  // Helper to get color based on status
  const getStatusColor = (status: string) => {
    switch (status) {
      case "normal": return "bg-green-50 border-green-200 text-green-800"
      case "abnormal": return "bg-amber-50 border-amber-200 text-amber-900" 
      case "critical": return "bg-red-50 border-red-200 text-red-900" 
      default: return "bg-slate-50 border-slate-200"
    }
  }

  // Helper to get icon based on status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "normal": return <CheckCircle2 className="h-5 w-5 mt-0.5 text-green-600 shrink-0" />
      case "abnormal": return <AlertCircle className="h-5 w-5 mt-0.5 text-amber-600 shrink-0" />
      case "critical": return <XCircle className="h-5 w-5 mt-0.5 text-red-600 shrink-0" />
      default: return null
    }
  }

  // Dynamic placeholder based on selection
  const getPlaceholder = () => {
    if (selectedBehavior === "resting") return "e.g. 9.81"
    if (selectedBehavior === "walking") return "e.g. 10.05"
    if (selectedBehavior === "eating") return "e.g. 10.08"
    if (selectedBehavior === "mounting") return "e.g. 10.29"
    if (selectedBehavior === "rumination") return "e.g. 9.10"
    return "e.g. 1.05"
  }

  return (
    <div className="max-w-2xl mx-auto mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="border-green-100 shadow-lg">
        <CardHeader className="bg-slate-50/50 border-b">
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-6 w-6 text-green-600" />
            <CardTitle>AI Behavior Prediction</CardTitle>
          </div>
          <CardDescription>
            Select a behavior and input the observed acceleration magnitude (ACC_MAG) to detect anomalies.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 pt-6">
          
          <div className="grid gap-4 md:grid-cols-2">
            {/* Behavior Selection */}
            <div className="space-y-2">
              <Label htmlFor="behavior">Target Behavior</Label>
              <Select value={selectedBehavior} onValueChange={setSelectedBehavior}>
                <SelectTrigger id="behavior">
                  <SelectValue placeholder="Select behavior..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="resting">Resting</SelectItem>
                  <SelectItem value="walking">Walking</SelectItem>
                  <SelectItem value="eating">Eating</SelectItem>
                  <SelectItem value="mounting">Mounting</SelectItem>
                  <SelectItem value="rumination">Rumination</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Acceleration Input */}
            <div className="space-y-2">
              <Label htmlFor="acceleration">Acceleration Magnitude (ACC_MAG)</Label>
              <Input
                id="acceleration"
                type="number"
                step="0.01"
                placeholder={getPlaceholder()}
                value={acceleration}
                onChange={(e) => setAcceleration(e.target.value)}
              />
            </div>
          </div>

          {/* Result Display Area */}
          {result && (
            <div className={`p-4 rounded-md flex items-start gap-3 border ${getStatusColor(result.status)}`}>
              {getStatusIcon(result.status)}
              
              <div className="space-y-1">
                <p className="font-semibold uppercase tracking-wide text-sm">
                  {result.status}
                </p>
                <p className="text-sm opacity-90">
                  {result.message}
                </p>
              </div>
            </div>
          )}

          {/* Professional Methodological Note */}
          <div className="bg-slate-50 border border-slate-200 rounded-md p-4 flex items-start gap-3 text-slate-600 mt-6">
            <Info className="h-5 w-5 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="font-semibold text-sm">Methodological Note</p>
              <p className="text-xs leading-relaxed opacity-90">
                While our production Bayesian model utilizes full probability distributions for behavioral inference, 
                this interface currently employs pre-calculated acceleration thresholds for immediate demonstration. 
                Furthermore, in the absence of real-time sensor streams, the input data represents 
                windowed segments—aggregates of specific duration—simulating the feature set used by our backend algorithms.
              </p>
            </div>
          </div>

        </CardContent>

        <CardFooter className="flex justify-end gap-2 bg-slate-50/50 border-t p-4">
          <Button variant="ghost" onClick={handleClear}>Clear</Button>
          <Button 
            onClick={handlePredict} 
            disabled={!selectedBehavior || !acceleration}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Run Prediction
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}