import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

/**
 * Terms of Use Page (Termes d'ús)
 * 
 * Terms and conditions for using ArquiNorma platform
 */

const TermsOfUsePage = () => {
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
            Termes d'Ús
          </h1>
          <p className="text-gray-600 mb-8">
            <strong>Última actualització:</strong> {new Date().toLocaleDateString('ca-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          {/* Introduction */}
          <section className="mb-12">
            <p className="text-lg text-gray-700 leading-relaxed">
              Benvingut a ArquiNorma. Aquests Termes d'Ús regulen l'accés i l'ús de la plataforma ArquiNorma, 
              un servei d'assistència d'IA per a la consulta de normativa urbanística. En utilitzar el servei, 
              acceptes aquests termes en la seva totalitat.
            </p>
          </section>

          {/* Section 1 */}
          <CollapsibleSection id="section1" title="1. Acceptació dels Termes">
            <div className="space-y-3">
              <p>
                En accedir i utilitzar ArquiNorma, acceptes estar vinculat per aquests Termes d'Ús i per totes les 
                lleis i regulacions aplicables. Si no estàs d'acord amb algun d'aquests termes, no has d'utilitzar el servei.
              </p>
              <p>
                ArquiNorma es reserva el dret de modificar aquests termes en qualsevol moment. L'ús continuat del servei 
                després de les modificacions implica l'acceptació dels nous termes.
              </p>
            </div>
          </CollapsibleSection>

          {/* Section 2 */}
          <CollapsibleSection id="section2" title="2. Descripció del Servei">
            <div className="space-y-3">
              <p>
                ArquiNorma és una plataforma d'assistència d'IA que proporciona informació sobre normativa urbanística 
                de Catalunya, incloent-hi ordenances municipals, Plans Generals Municipals (PGM) i altres normatives aplicables.
              </p>
              <p>
                El servei inclou:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Consulta de normativa urbanística per municipi</li>
                <li>Respostes a preguntes sobre normativa mitjançant IA</li>
                <li>Accés a documents normatius oficials</li>
                <li>Xat especialitzat per consultes sobre el Codi Tècnic de l'Edificació (CTE)</li>
                <li>Gestió de projectes per municipi</li>
                <li>Funcionalitats addicionals segons el pla de subscripció</li>
              </ul>
            </div>
          </CollapsibleSection>

          {/* Section 3 */}
          <CollapsibleSection id="section3" title="3. Registre i Compte d'Usuari">
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">3.1. Creació de Compte</h3>
                <p>
                  Per utilitzar ArquiNorma, has de crear un compte proporcionant informació veritable, exacta i completa. 
                  Ets responsable de mantenir la confidencialitat de les teves credencials d'accés.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">3.2. Responsabilitat del Compte</h3>
                <p>Ets responsable de:</p>
                <ul className="list-disc pl-6 space-y-2 mt-2">
                  <li>Totes les activitats que es produeixin sota el teu compte</li>
                  <li>Mantenir la seguretat de les teves credencials</li>
                  <li>Notificar-nos immediatament de qualsevol ús no autoritzat del teu compte</li>
                  <li>Proporcionar informació actualitzada i precisa</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">3.3. Edat Mínima</h3>
                <p>
                  Has de tenir almenys 18 anys per crear un compte i utilitzar el servei. ArquiNorma està dirigit a 
                  professionals de l'arquitectura i no està destinat a menors d'edat.
                </p>
              </div>
            </div>
          </CollapsibleSection>

          {/* Section 4 */}
          <CollapsibleSection id="section4" title="4. Subscripcions i Pagaments">
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">4.1. Plans de Subscripció</h3>
                <p>
                  ArquiNorma ofereix diferents plans de subscripció amb funcionalitats i límits diferents. 
                  Les característiques de cada pla es detallen a la pàgina de preus.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">4.2. Pagaments</h3>
                <p>
                  Els pagaments es processen de forma segura a través de Stripe. En subscriure't, acceptes que es 
                  facturi el preu del pla seleccionat de forma recurrent segons la periodicitat establerta (mensual o anual).
                </p>
                <p className="mt-2">
                  Tots els preus s'indiquen en euros (€) i inclouen els impostos aplicables.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">4.3. Renovació i Cancel·lació</h3>
                <p>
                  Les subscripcions es renoven automàticament al final de cada període de facturació. Pots cancel·lar 
                  la teva subscripció en qualsevol moment des de la configuració del compte. La cancel·lació entrarà 
                  en vigor al final del període de facturació actual.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">4.4. Reemborsaments</h3>
                <p>
                  En general, no oferim reemborsaments per subscripcions ja facturades. No obstant això, considerarem 
                  reemborsaments en casos excepcionals i a la nostra única discreció.
                </p>
              </div>
            </div>
          </CollapsibleSection>

          {/* Section 5 */}
          <CollapsibleSection id="section5" title="5. Ús Acceptable">
            <div className="space-y-4">
              <p>Compromes a utilitzar ArquiNorma de manera legal i conforme a aquests termes. Específicament, acceptes:</p>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">5.1. Ús Permès</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Utilitzar el servei per a finalitats professionals relacionades amb l'arquitectura i la normativa urbanística</li>
                  <li>Consultar la normativa per als teus projectes professionals</li>
                  <li>Compartir informació amb els membres del teu equip dins dels límits del teu pla de subscripció</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">5.2. Ús Prohibit</h3>
                <p>Queda estrictament prohibit:</p>
                <ul className="list-disc pl-6 space-y-2 mt-2">
                  <li>Utilitzar el servei per a finalitats il·legals o no autoritzades</li>
                  <li>Intentar accedir a sistemes, comptes o àrees restringides</li>
                  <li>Utilitzar robots, scripts o eines automatitzades per accedir al servei sense autorització</li>
                  <li>Copiar, modificar, distribuir o crear obres derivades del servei sense autorització</li>
                  <li>Utilitzar el servei per a competir amb ArquiNorma o per crear un servei similar</li>
                  <li>Transmetre virus, codi maliciós o qualsevol altre element nociu</li>
                  <li>Interferir o interrompre el funcionament del servei</li>
                  <li>Utilitzar el servei de manera que pugui danyar, deshabilitar o sobrecarregar els nostres sistemes</li>
                  <li>Suplantar la identitat d'una altra persona o entitat</li>
                </ul>
              </div>
            </div>
          </CollapsibleSection>

          {/* Section 6 */}
          <CollapsibleSection id="section6" title="6. Propietat Intel·lectual">
            <div className="space-y-3">
              <p>
                El servei ArquiNorma, incloent-hi tot el seu contingut, funcionalitats, programari, disseny, logotips, 
                marques i altres materials, és propietat d'ArquiNorma o dels seus llicenciadors i està protegit per les 
                lleis de propietat intel·lectual.
              </p>
              <p>
                No adquireixes cap dret de propietat sobre el servei o el seu contingut mitjançant l'ús del servei. 
                Tots els drets no expressament concedits en aquests termes queden reservats.
              </p>
              <p>
                Respecte als continguts que puguis pujar al servei (com ara PDFs), conserves tots els drets de propietat 
                intel·lectual sobre aquests continguts. En pujar contingut, ens concedeixes una llicència per utilitzar, 
                processar i emmagatzemar aquest contingut per proporcionar-te el servei.
              </p>
            </div>
          </CollapsibleSection>

          {/* Section 7 */}
          <CollapsibleSection id="section7" title="7. Limitació de Responsabilitat">
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">7.1. Naturalesa de la Informació</h3>
                <p>
                  ArquiNorma proporciona informació basada en documents normatius oficials mitjançant tecnologia d'IA. 
                  Tot i que ens esforcem per proporcionar informació precisa i actualitzada:
                </p>
                <ul className="list-disc pl-6 space-y-2 mt-2">
                  <li>La informació proporcionada és només orientativa i no constitueix assessorament legal o professional</li>
                  <li>No garanteix l'exactitud, completesa o actualitat de tota la informació</li>
                  <li>No es fa responsable de les decisions professionals preses basant-se en la informació del servei</li>
                  <li>Recomana sempre verificar la informació amb les fonts originals i consultar amb professionals qualificats</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">7.2. Disponibilitat del Servei</h3>
                <p>
                  ArquiNorma esforça per mantenir el servei disponible, però no garanteix que el servei estigui sempre 
                  accessible, ininterromput, segur o lliure d'errors. El servei pot estar subjecte a manteniment, actualitzacions 
                  o interrupcions per causes fora del nostre control.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">7.3. Exclusions de Responsabilitat</h3>
                <p>En la màxima mesura permesa per la llei, ArquiNorma no es fa responsable de:</p>
                <ul className="list-disc pl-6 space-y-2 mt-2">
                  <li>Danys directes, indirectes, incidents, especials o conseqüencials</li>
                  <li>Pèrdua de beneficis, dades, oportunitats o reputació</li>
                  <li>Interrupcions del servei o pèrdua d'accés al servei</li>
                  <li>Errors o omissions en el contingut</li>
                  <li>Danys causats per virus o altres elements nocius</li>
                  <li>Accions de tercers</li>
                </ul>
              </div>
            </div>
          </CollapsibleSection>

          {/* Section 8 */}
          <CollapsibleSection id="section8" title="8. Modificació i Finalització del Servei">
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">8.1. Modificacions del Servei</h3>
                <p>
                  ArquiNorma es reserva el dret de modificar, suspendre o interrompre qualsevol aspecte del servei en qualsevol 
                  moment, amb o sense preavís. Això inclou canvis en funcionalitats, preus, límits d'ús i disponibilitat.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">8.2. Finalització del Compte</h3>
                <p>
                  Pots cancel·lar el teu compte en qualsevol moment des de la configuració del compte. ArquiNorma també es reserva 
                  el dret de suspendre o finalitzar el teu compte si violes aquests termes o per qualsevol altre motiu legítim.
                </p>
                <p className="mt-2">
                  En cas de finalització, perdras l'accés al servei i a les teves dades. ArquiNorma no es fa responsable de la 
                  pèrdua de dades derivada de la finalització del compte.
                </p>
              </div>
            </div>
          </CollapsibleSection>

          {/* Section 9 */}
          <CollapsibleSection id="section9" title="9. Protecció de Dades">
            <div className="space-y-3">
              <p>
                El tractament de les teves dades personals es regeix per la nostra <Link to="/privacy" className="text-amber-600 hover:text-amber-700 underline">Política de Privacitat</Link>. 
                En utilitzar el servei, acceptes el tractament de les teves dades d'acord amb aquesta política.
              </p>
            </div>
          </CollapsibleSection>

          {/* Section 10 */}
          <CollapsibleSection id="section10" title="10. Resolució de Controvèrsies">
            <div className="space-y-3">
              <p>
                Aquests termes es regeixen per la legislació espanyola. Per a qualsevol controvèrsia que pugui sorgir, 
                les parts es someten als jutjats i tribunals de Barcelona, renunciant expressament a qualsevol altre fur 
                que pogués correspondre'ls.
              </p>
              <p>
                Abans de recórrer als tribunals, les parts es comprometen a intentar resoldre les controvèrsies mitjançant 
                negociació de bona fe.
              </p>
            </div>
          </CollapsibleSection>

          {/* Section 11 */}
          <CollapsibleSection id="section11" title="11. Disposicions Generals">
            <div className="space-y-3">
              <p>
                Si alguna disposició d'aquests termes es considera invàlida o inaplicable, la resta de disposicions continuaran 
                en ple vigor i efecte.
              </p>
              <p>
                La no aplicació d'una disposició d'aquests termes no constitueix una renúncia a aquesta disposició.
              </p>
              <p>
                Aquests termes constitueixen l'acord complet entre tu i ArquiNorma respecte a l'ús del servei.
              </p>
            </div>
          </CollapsibleSection>

          {/* Section 12 */}
          <CollapsibleSection id="section12" title="12. Contacte">
            <div className="space-y-3">
              <p>
                Per a qualsevol pregunta sobre aquests Termes d'Ús, pots contactar-nos:
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
              Aquests Termes d'Ús estan en vigor des de la seva publicació. L'ús del servei implica l'acceptació d'aquests termes.
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

export default TermsOfUsePage;

