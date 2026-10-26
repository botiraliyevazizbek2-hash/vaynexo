import { registrationReady } from '@/lib/registration/database'
export const dynamic='force-dynamic'
import { LanguageProvider } from '@/components/language-provider'
import MlbbApp from '@/components/mlbb-app'
export default function Page() {
 return <LanguageProvider><MlbbApp phoneAvailable={registrationReady()}/></LanguageProvider>
}
