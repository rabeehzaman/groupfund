import { getSettings } from "@/lib/actions/settings"
import { SettingsForm, ThemeToggle } from "./settings-form"

export default async function SettingsPage() {
  const settings = await getSettings()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure group fund settings.
        </p>
      </div>
      <ThemeToggle />
      <SettingsForm settings={settings} />
    </div>
  )
}
