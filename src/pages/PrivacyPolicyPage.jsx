import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

/**
 * Privacy Policy Page
 * 
 * Comprehensive privacy policy for ArquiNorma, GDPR-compliant
 * Adapted for AI-powered normativa consultation platform
 */

const PrivacyPolicyPage = () => {
  // State to track which sections are open (all closed by default)
  const [openSections, setOpenSections] = useState({});

  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
    // Also try scrolling the window and document
    if (window.scrollY > 0) {
      window.scrollTo(0, 0);
    }
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  // Toggle section open/closed
  const toggleSection = (sectionId) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Collapsible Section Component
  const CollapsibleSection = ({ id, title, children }) => {
    const isOpen = openSections[id];

    return (
      <section className="mb-6 border-b border-gray-200 pb-6">
        <button
          onClick={() => toggleSection(id)}
          className="w-full text-left flex items-center justify-between py-4 hover:bg-gray-50 -mx-4 px-4 rounded-lg transition-colors"
        >
          <h2 className="text-2xl font-bold text-gray-900 pr-4">
            {title}
          </h2>
          <svg
            className={`w-6 h-6 text-amber-600 flex-shrink-0 transition-transform duration-200 ${
              isOpen ? 'transform rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isOpen ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="pt-4 text-gray-700">
            {children}
          </div>
        </div>
      </section>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">ArquiNorma</span>
            </Link>
            <Link 
              to="/" 
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Tornar a l'inici
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-lg max-w-none">
          {/* Title */}
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Política de Privacitat
          </h1>
          <p className="text-gray-600 mb-8">
            <strong>Última actualització:</strong> {new Date().toLocaleDateString('ca-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          {/* Introduction */}
          <section className="mb-12">
            <p className="text-lg text-gray-700 leading-relaxed">
              A ArquiNorma, respectem la teva privacitat i ens comprometem a protegir les teves dades personals. 
              Aquesta Política de Privacitat explica com recopilem, utilitzem, emmagatzemem i protegim la teva informació 
              personal quan utilitzes la nostra plataforma d'assistència d'IA per a la consulta de normativa urbanística.
            </p>
          </section>

          {/* Section 1 */}
          <CollapsibleSection id="section1" title="1. Responsable del Tractament">
            <div className="space-y-3">
              <p>
                <strong>Denominació social:</strong> ArquiNorma
              </p>
              <p>
                <strong>Correu electrònic de contacte:</strong> privacitat@arquinorma.cat
              </p>
              <p>
                <strong>Correu electrònic de suport:</strong> suport@arquinorma.cat
              </p>
              <p>
                ArquiNorma és el responsable del tractament de les teves dades personals d'acord amb el 
                Reglament General de Protecció de Dades (RGPD) i la Llei Orgànica 3/2018, de 5 de desembre, 
                de Protecció de Dades Personals i garantia dels drets digitals.
              </p>
            </div>
          </CollapsibleSection>

          {/* Section 2 */}
          <CollapsibleSection id="section2" title="2. Dades que Recopilem">
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">2.1. Dades que ens proporciones</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Dades d'identificació:</strong> Nom complet, correu electrònic, empresa (opcional)</li>
                  <li><strong>Dades de compte:</strong> Credencials d'accés, preferències d'usuari</li>
                  <li><strong>Dades de projecte:</strong> Informació sobre els teus projectes arquitectònics, municipis seleccionats</li>
                  <li><strong>Dades de pagament:</strong> Informació de facturació i pagament (processada de forma segura a través de Stripe)</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">2.2. Dades que recopilem automàticament</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Dades tècniques:</strong> Adreça IP, tipus de navegador, sistema operatiu, identificadors de dispositiu</li>
                  <li><strong>Dades d'ús:</strong> Pàgines visitades, temps de sessió, funcionalitats utilitzades</li>
                  <li><strong>Cookies i tecnologies similars:</strong> Per millorar l'experiència d'usuari i analitzar l'ús del servei</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">2.3. Dades de contingut</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Consultes i preguntes:</strong> Les teves preguntes sobre normativa urbanística</li>
                  <li><strong>Documents pujats:</strong> PDFs que puguis pujar per a la seva consulta (si utilitzes aquesta funcionalitat)</li>
                  <li><strong>Historial de consultes:</strong> Per permetre't accedir a consultes anteriors</li>
                </ul>
              </div>
            </div>
          </CollapsibleSection>

          {/* Section 3 */}
          <CollapsibleSection id="section3" title="3. Finalitats del Tractament">
            <div className="space-y-4">
              <p>Utilitzem les teves dades personals per a les següents finalitats:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Prestació del servei:</strong> Per proporcionar-te accés a la plataforma i respondre les teves consultes sobre normativa urbanística</li>
                <li><strong>Millora del servei:</strong> Per analitzar l'ús de la plataforma i millorar la qualitat de les respostes de l'IA</li>
                <li><strong>Gestió de compte:</strong> Per gestionar el teu compte d'usuari, subscripció i pagaments</li>
                <li><strong>Comunicació:</strong> Per enviar-te informació sobre el servei, actualitzacions i comunicacions relacionades amb el teu compte</li>
                <li><strong>Cumpliment legal:</strong> Per complir amb les obligacions legals i normatives aplicables</li>
                <li><strong>Seguretat:</strong> Per detectar i prevenir frau, abús i altres activitats il·legals</li>
              </ul>
            </div>
          </CollapsibleSection>

          {/* Section 4 */}
          <CollapsibleSection id="section4" title="4. Base Legal del Tractament">
            <div className="space-y-3">
              <p>El tractament de les teves dades personals es basa en:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Execució d'un contracte:</strong> Per a la prestació del servei que sol·licites</li>
                <li><strong>Consentiment:</strong> Per a l'enviament de comunicacions comercials i l'ús de cookies no essencials</li>
                <li><strong>Interès legítim:</strong> Per a la millora del servei, seguretat i prevenció de frau</li>
                <li><strong>Cumpliment d'obligacions legals:</strong> Per complir amb les obligacions fiscals i de facturació</li>
              </ul>
            </div>
          </CollapsibleSection>

          {/* Section 5 */}
          <CollapsibleSection id="section5" title="5. Conservació de les Dades">
            <div className="space-y-3">
              <p>
                Conservarem les teves dades personals durant el temps necessari per a les finalitats per a les quals 
                van ser recollides, i en qualsevol cas:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Mentre mantinguis un compte actiu a ArquiNorma</li>
                <li>Durant el període necessari per complir amb les obligacions legals (normalment 6 anys per a dades fiscals)</li>
                <li>Fins que sol·licitis la supressió de les teves dades, sempre que no hi hagi una obligació legal de conservació</li>
              </ul>
              <p>
                Un cop finalitzat el període de conservació, les dades seran eliminades de forma segura i irreversible.
              </p>
            </div>
          </CollapsibleSection>

          {/* Section 6 */}
          <CollapsibleSection id="section6" title="6. Compartició de Dades">
            <div className="space-y-4">
              <p>
                No venem ni lloguem les teves dades personals. Podem compartir les teves dades amb:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Proveïdors de serveis:</strong> Empreses que ens ajuden a operar la plataforma (allotjament, processament de pagaments, anàlisi). Tots els proveïdors estan contractuats com a encarregats de tractament i només poden utilitzar les dades per als fins especificats.</li>
                <li><strong>Stripe:</strong> Per al processament de pagaments. Les teves dades de pagament són processades directament per Stripe i no són emmagatzemades als nostres servidors.</li>
                <li><strong>Supabase:</strong> Per a l'allotjament de la base de dades i autenticació d'usuaris.</li>
                <li><strong>Autoritats competents:</strong> Quan sigui necessari per complir amb obligacions legals o respondre a requeriments judicials.</li>
              </ul>
              <p>
                Tots els proveïdors de serveis estan ubicats dins de l'Espai Econòmic Europeu o tenen garanties adequades de protecció de dades.
              </p>
            </div>
          </CollapsibleSection>

          {/* Section 7 */}
          <CollapsibleSection id="section7" title="7. Seguretat de les Dades">
            <div className="space-y-3">
              <p>
                Implementem mesures tècniques i organitzatives adequades per protegir les teves dades personals:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Xifratge:</strong> Les dades es transmeten i emmagatzemen de forma xifrada (HTTPS/TLS)</li>
                <li><strong>Autenticació:</strong> Sistemes segurs d'autenticació d'usuaris</li>
                <li><strong>Control d'accés:</strong> Accés restringit a les dades només per al personal autoritzat</li>
                <li><strong>Monitoreig:</strong> Sistemes de detecció i prevenció d'intrusions</li>
                <li><strong>Còpies de seguretat:</strong> Còpies de seguretat regulars i planes de recuperació</li>
              </ul>
              <p>
                Malgrat les mesures implementades, cap sistema és 100% segur. Si detectem una violació de seguretat 
                que pugui afectar les teves dades, t'informarem immediatament d'acord amb la normativa aplicable.
              </p>
            </div>
          </CollapsibleSection>

          {/* Section 8 */}
          <CollapsibleSection id="section8" title="8. Els Teus Drets">
            <div className="space-y-4">
              <p>
                D'acord amb el RGPD, tens els següents drets respecte a les teves dades personals:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Dret d'accés:</strong> Pots sol·licitar informació sobre les teves dades personals que processem</li>
                <li><strong>Dret de rectificació:</strong> Pots sol·licitar la correcció de dades inexactes o incompletes</li>
                <li><strong>Dret de supressió:</strong> Pots sol·licitar l'eliminació de les teves dades quan ja no siguin necessàries</li>
                <li><strong>Dret a la limitació del tractament:</strong> Pots sol·licitar la limitació del tractament en determinades circumstàncies</li>
                <li><strong>Dret a la portabilitat:</strong> Pots sol·licitar rebre les teves dades en un format estructurat i d'ús comú</li>
                <li><strong>Dret d'oposició:</strong> Pots oposar-te al tractament de les teves dades per a finalitats de màrqueting directe</li>
                <li><strong>Dret a retirar el consentiment:</strong> Pots retirar el teu consentiment en qualsevol moment</li>
              </ul>
              <p>
                Per exercir aquests drets, pots contactar-nos a <strong>privacitat@arquinorma.cat</strong>. 
                Respondrem a la teva sol·licitud en el termini màxim d'un mes.
              </p>
              <p>
                També tens dret a presentar una reclamació davant l'Agència Espanyola de Protecció de Dades (AEPD) 
                si consideres que el tractament de les teves dades no compleix la normativa vigent.
              </p>
            </div>
          </CollapsibleSection>

          {/* Section 9 */}
          <CollapsibleSection id="section9" title="9. Cookies i Tecnologies Similars">
            <div className="space-y-3">
              <p>
                Utilitzem cookies i tecnologies similars per millorar l'experiència d'usuari i analitzar l'ús del servei. 
                Pots gestionar les teves preferències de cookies a través de la configuració del teu navegador.
              </p>
              <p>
                Per a més informació, consulta la nostra <Link to="/cookies" className="text-amber-600 hover:text-amber-700 underline">Política de Cookies</Link>.
              </p>
            </div>
          </CollapsibleSection>

          {/* Section 10 */}
          <CollapsibleSection id="section10" title="10. Menors d'Edat">
            <div className="space-y-3">
              <p>
                ArquiNorma està dirigit a professionals de l'arquitectura i no està destinat a menors de 18 anys. 
                No recopilem intencionadament dades personals de menors d'edat. Si detectem que hem recopilat dades 
                d'un menor sense el consentiment dels pares o tutors, prendrem mesures per eliminar aquestes dades immediatament.
              </p>
            </div>
          </CollapsibleSection>

          {/* Section 11 */}
          <CollapsibleSection id="section11" title="11. Transferències Internacionals">
            <div className="space-y-3">
              <p>
                Les teves dades personals poden ser processades per proveïdors de serveis ubicats fora de l'Espai Econòmic Europeu. 
                En aquests casos, assegurem que hi hagi garanties adequades de protecció de dades, com ara:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Clàusules contractuals tipus aprovades per la Comissió Europea</li>
                <li>Certificacions adequades (com Privacy Shield o equivalents)</li>
                <li>Garanties adequades segons la normativa aplicable</li>
              </ul>
            </div>
          </CollapsibleSection>

          {/* Section 12 */}
          <CollapsibleSection id="section12" title="12. Canvis en aquesta Política">
            <div className="space-y-3">
              <p>
                Podem actualitzar aquesta Política de Privacitat ocasionalment per reflectir canvis en les nostres pràctiques 
                o per altres motius operatius, legals o normatius. T'informarem de qualsevol canvi significatiu mitjançant:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Notificació per correu electrònic</li>
                <li>Avís prominent a la plataforma</li>
                <li>Actualització de la data de "Última actualització" al principi d'aquesta política</li>
              </ul>
              <p>
                Et recomanem que revisis periòdicament aquesta política per estar informat sobre com protegim les teves dades.
              </p>
            </div>
          </CollapsibleSection>

          {/* Section 13 */}
          <CollapsibleSection id="section13" title="13. Contacte">
            <div className="space-y-3">
              <p>
                Si tens preguntes sobre aquesta Política de Privacitat o sobre el tractament de les teves dades personals, 
                pots contactar-nos:
              </p>
              <div className="bg-amber-50 border-l-4 border-amber-400 p-4 my-4">
                <p className="font-semibold text-gray-900 mb-2">ArquiNorma</p>
                <p className="text-gray-700">
                  <strong>Correu electrònic:</strong> privacitat@arquinorma.cat
                </p>
                <p className="text-gray-700">
                  <strong>Suport:</strong> suport@arquinorma.cat
                </p>
              </div>
            </div>
          </CollapsibleSection>

          {/* Footer Note */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              Aquesta política de privacitat està en vigor des de la seva publicació i compleix amb el 
              Reglament General de Protecció de Dades (RGPD) i la legislació espanyola aplicable.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <span className="text-xl font-bold">ArquiNorma</span>
              </div>
              <p className="text-gray-400 text-sm">
                El primer assistent normatiu per a arquitectes.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link to="/privacy" className="hover:text-white transition-colors">Política de privacitat</Link></li>
                <li><Link to="/terms" className="hover:text-white transition-colors">Termes d'ús</Link></li>
                <li><a href="mailto:suport@arquinorma.cat" className="hover:text-white transition-colors">Suport</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contacte</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="mailto:privacitat@arquinorma.cat" className="hover:text-white transition-colors">Privacitat</a></li>
                <li><a href="mailto:suport@arquinorma.cat" className="hover:text-white transition-colors">Suport</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 mt-8 text-center text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} ArquiNorma. Tots els drets reservats.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicyPage;

