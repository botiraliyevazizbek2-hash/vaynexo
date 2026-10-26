import Link from 'next/link';
import { LanguageProvider } from '../../components/language-provider';
import { RegistrationGate } from '../../components/registration/registration-gate';
import { registrationReady } from '../../lib/registration/database';
export const dynamic='force-dynamic';
export default function RegisterPage(){return <LanguageProvider><RegistrationGate required available={registrationReady()}><main className="registration-shell"><section className="registration-card"><h1>VAYNEXO</h1><Link className="button primary full" href="/">Mini App →</Link></section></main></RegistrationGate></LanguageProvider>;}
