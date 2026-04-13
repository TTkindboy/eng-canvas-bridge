import { useState } from "react"
import { authViaApiKey } from "@/lib/client"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Input } from "@/components/ui/input"

interface AuthScreenProps {
  onAuthenticated: () => void
}

export function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [apiKey, setApiKey] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!apiKey.trim()) return

    setLoading(true)
    setError(null)

    try {
      const { response } = await authViaApiKey({ body: { api_key: apiKey.trim() } })

      if (response?.ok) {
        onAuthenticated()
      } else if (response?.status === 401) {
        setError("Invalid API key. Please check and try again.")
      } else {
        setError("Unable to reach the backend. Check the server and try again.")
      }
    } catch {
      setError("Unable to reach the backend. Check the server and try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Connect to Canvas
          </h1>
          <div className="flex flex-col gap-2">
            <Input
              id="api-key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Paste your Canvas API key…"
              disabled={loading}
              autoFocus
              className="focus-visible:ring-2"
            />
            {error && (
              <p className="text-xs text-destructive font-medium">{error}</p>
            )}
          </div>
          <Button type="submit" variant="default" disabled={!apiKey.trim() || loading} className="w-full">
            {loading ? <Spinner className="size-4" /> : <>Continue <ArrowRight /></>}
          </Button>
        </form>
      </div>
    </main>
  )
}
