import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

/**
 * Legal Notice Page (Avis Legal)
 * 
 * Legal notice for ArquiNorma, compliant with Spanish and Catalan regulations
 */

const LegalNoticePage = () => {
  // State to track which sections are open (all closed by default)
  const [openSections, setOpenSections] = useState({});

  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
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
            Avís Legal
          </h1>
          <p className="text-gray-600 mb-8">
            <strong>Última actualització:</strong> {new Date().toLocaleDateString('ca-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          {/* Introduction */}
          <section className="mb-12">
            <p className="text-lg text-gray-700 leading-relaxed">
              A continuació es detallen les condicions generals d'ús del lloc web i del servei ArquiNorma, 
              així com la informació legal relativa a la responsabilitat i propietat intel·lectual.
            </p>
          </section>

          {/* Section 1 */}
          <CollapsibleSection id="section1" title="1. Dades Identificatives">
            <div className="space-y-3">
              <p>
                D'acord amb l'article 10 de la Llei 34/2002, de 11 de juliol, de Serveis de la Societat de la Informació 
                i de Comerç Electrònic, es faciliten les següents dades identificatives:
              </p>
              <div className="bg-amber-50 border-l-4 border-amber-400 p-4 my-4">
                <p className="font-semibold text-gray-900 mb-2">ArquiNorma</p>
                <p className="text-gray-700">
                  <strong>Correu electrònic:</strong> info@arquinorma.cat
                </p>
                <p className="text-gray-700">
                  <strong>Suport:</strong> suport@arquinorma.cat
                </p>
                <p className="text-gray-700">
                  <strong>Privacitat:</strong> privacitat@arquinorma.cat
                </p>
              </div>
            </div>
          </CollapsibleSection>

          {/* Section 2 */}
          <CollapsibleSection id="section2" title="2. Objecte i Àmbit d'Aplicació">
            <div className="space-y-3">
              <p>
                Aquest avís legal regula l'ús del lloc web <strong>app.arquinorma.cat</strong> i del servei ArquiNorma, 
                una plataforma d'assistència d'IA per a la consulta de normativa urbanística de Catalunya.
              </p>
              <p>
                L'accés i ús del lloc web i del servei implica l'acceptació d'aquest avís legal i de les condicions 
                generals d'ús. Si no estàs d'acord amb aquestes condicions, et recomanem que no utilitzis el servei.
              </p>
            </div>
          </CollapsibleSection>

          {/* Section 3 */}
          <CollapsibleSection id="section3" title="3. Condicions Generals d'Ús">
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">3.1. Accés al Servei</h3>
                <p>
                  L'accés al servei ArquiNorma requereix registre prèvi i acceptació d'aquestes condicions. 
                  L'usuari es compromet a proporcionar informació veritable, exacta i completa.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">3.2. Ús del Servei</h3>
                <p>L'usuari es compromet a utilitzar el servei de manera adequada i conforme a la llei, i en concret:</p>
                <ul className="list-disc pl-6 space-y-2 mt-2">
                  <li>No utilitzar el servei per a finalitats il·legals o no autoritzades</li>
                  <li>No intentar accedir a sistemes o àrees restringides del servei</li>
                  <li>No interferir o interrompre el funcionament del servei</li>
                  <li>No utilitzar robots, scripts o altres eines automatitzades sense autorització</li>
                  <li>No copiar, modificar o distribuir el contingut del servei sense autorització</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">3.3. Responsabilitat de l'Usuari</h3>
                <p>
                  L'usuari és l'únic responsable de l'ús que faci del servei i de les consultes que realitzi. 
                  ArquiNorma no es fa responsable de les decisions professionals preses basant-se en la informació 
                  proporcionada per la plataforma.
                </p>
              </div>
            </div>
          </CollapsibleSection>

          {/* Section 4 */}
          <CollapsibleSection id="section4" title="4. Propietat Intel·lectual i Industrial">
            <div className="space-y-3">
              <p>
                Tots els continguts del lloc web i del servei ArquiNorma, incloent-hi però sense limitar-se a textos, 
                gràfics, logos, icones, imatges, arxius d'àudio, descàrregues digitals, compilacions de dades i programari, 
                són propietat d'ArquiNorma o dels seus proveïdors de contingut i estan protegits per les lleis espanyoles 
                i internacionals de propietat intel·lectual i industrial.
              </p>
              <p>
                Queda expressament prohibida la reproducció, distribució, comunicació pública i transformació, total o parcial, 
                dels continguts d'aquest lloc web, amb finalitats comercials, en qualsevol suport i per qualsevol mitjà tècnic, 
                sense l'autorització prèvia i per escrit d'ArquiNorma.
              </p>
              <p>
                Les marques, noms comercials o signes distintius de qualsevol classe continguts en el lloc web són propietat 
                d'ArquiNorma o de tercers, sense que pugui entendre's que l'ús o accés al lloc web atorgui a l'usuari cap dret 
                sobre les esmentades marques, noms comercials i/o signes distintius.
              </p>
            </div>
          </CollapsibleSection>

          {/* Section 5 */}
          <CollapsibleSection id="section5" title="5. Limitació de Responsabilitat">
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">5.1. Informació i Continguts</h3>
                <p>
                  ArquiNorma esforça per mantenir la informació del servei actualitzada i precisa. No obstant això, 
                  ArquiNorma no garanteix l'exactitud, completesa o actualitat de la informació proporcionada per l'IA, 
                  ni que les respostes siguin adequades per a tots els casos específics.
                </p>
                <p className="mt-2">
                  <strong>Important:</strong> Les respostes de l'IA es basen en documents normatius oficials, però sempre 
                  s'ha de verificar la informació amb les fonts originals i consultar amb professionals qualificats per a 
                  decisions crítiques.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">5.2. Disponibilitat del Servei</h3>
                <p>
                  ArquiNorma no garanteix la disponibilitat i continuïtat del funcionament del lloc web i del servei. 
                  No obstant això, es compromet a fer els millors esforços per mantenir el servei operatiu.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">5.3. Exclusions de Responsabilitat</h3>
                <p>ArquiNorma no es fa responsable de:</p>
                <ul className="list-disc pl-6 space-y-2 mt-2">
                  <li>Les decisions professionals preses basant-se en la informació del servei</li>
                  <li>Danys derivats de l'ús incorrecte del servei</li>
                  <li>Interrupcions del servei per causes fora del control d'ArquiNorma</li>
                  <li>La qualitat, legalitat, fiabilitat i utilitat de la informació proporcionada per tercers</li>
                  <li>Danys causats per virus o altres elements nocius</li>
                </ul>
              </div>
            </div>
          </CollapsibleSection>

          {/* Section 6 */}
          <CollapsibleSection id="section6" title="6. Enllaços a Tercers">
            <div className="space-y-3">
              <p>
                El lloc web pot contenir enllaços a llocs web de tercers. ArquiNorma no exerceix cap control sobre aquests 
                llocs web i no assumeix cap responsabilitat pel seu contingut o les seves polítiques de privacitat.
              </p>
              <p>
                L'inclusió d'enllaços no implica cap tipus d'associació, fusió o participació amb les entitats connectades.
              </p>
            </div>
          </CollapsibleSection>

          {/* Section 7 */}
          <CollapsibleSection id="section7" title="7. Protecció de Dades Personals">
            <div className="space-y-3">
              <p>
                El tractament de les dades personals es regeix per la nostra <Link to="/privacy" className="text-amber-600 hover:text-amber-700 underline">Política de Privacitat</Link>, 
                que compleix amb el Reglament General de Protecció de Dades (RGPD) i la legislació espanyola aplicable.
              </p>
              <p>
                Per a més informació sobre com tractem les teves dades personals, consulta la nostra Política de Privacitat.
              </p>
            </div>
          </CollapsibleSection>

          {/* Section 8 */}
          <CollapsibleSection id="section8" title="8. Modificacions">
            <div className="space-y-3">
              <p>
                ArquiNorma es reserva el dret de modificar aquest avís legal en qualsevol moment. Les modificacions 
                entraràn en vigor des de la seva publicació al lloc web.
              </p>
              <p>
                L'ús continuat del servei després de les modificacions implica l'acceptació de les noves condicions.
              </p>
              <p>
                Es recomana revisar periòdicament aquest avís legal per estar informat de qualsevol canvi.
              </p>
            </div>
          </CollapsibleSection>

          {/* Section 9 */}
          <CollapsibleSection id="section9" title="9. Legislació Aplicable i Jurisdicció">
            <div className="space-y-3">
              <p>
                Aquest avís legal es regeix per la legislació espanyola. Per a qualsevol controvèrsia que pugui sorgir 
                respecte a la interpretació o aplicació d'aquest avís legal, les parts es someten als jutjats i tribunals 
                de Barcelona, renunciant expressament a qualsevol altre fur que pogués correspondre'ls.
              </p>
            </div>
          </CollapsibleSection>

          {/* Section 10 */}
          <CollapsibleSection id="section10" title="10. Contacte">
            <div className="space-y-3">
              <p>
                Per a qualsevol pregunta o aclariment sobre aquest avís legal, pots contactar-nos:
              </p>
              <div className="bg-amber-50 border-l-4 border-amber-400 p-4 my-4">
                <p className="font-semibold text-gray-900 mb-2">ArquiNorma</p>
                <p className="text-gray-700">
                  <strong>Correu electrònic:</strong> info@arquinorma.cat
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
              Aquest avís legal està en vigor des de la seva publicació i compleix amb la legislació espanyola aplicable.
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
                L'assistent d'IA que ajuda els arquitectes a consultar la normativa urbanística de Catalunya.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link to="/privacy" className="hover:text-white transition-colors">Política de privacitat</Link></li>
                <li><Link to="/terms" className="hover:text-white transition-colors">Termes d'ús</Link></li>
                <li><Link to="/legal" className="hover:text-white transition-colors">Avís legal</Link></li>
                <li><a href="mailto:suport@arquinorma.cat" className="hover:text-white transition-colors">Suport</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contacte</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="mailto:info@arquinorma.cat" className="hover:text-white transition-colors">Informació</a></li>
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

export default LegalNoticePage;

