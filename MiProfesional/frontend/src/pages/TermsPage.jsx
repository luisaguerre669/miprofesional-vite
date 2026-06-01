import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';

const TermsPage = () => {
  return (
    <div className="min-h-[calc(100vh-200px)] py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <Shield size={24} className="text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Términos y Condiciones</h1>
              <p className="text-sm text-gray-500">MiProfesional - Plataforma de conexión profesional</p>
            </div>
          </div>

          <div className="text-xs text-gray-400 mb-8">Última actualización: 31 de mayo de 2026</div>

          <div className="prose prose-sm max-w-none text-gray-700 space-y-6">
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Definiciones</h2>
              <p>
                <strong>MiProfesional</strong> (la "Plataforma") es un servicio digital de conexión entre profesionales y clientes. 
                La Plataforma opera como un intermediario tecnológico que facilita el encuentro entre oferta y demanda de servicios profesionales.
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li><strong>Usuario:</strong> toda persona física que se registre en la Plataforma, ya sea como cliente, profesional o empresa.</li>
                <li><strong>Cliente:</strong> usuario que busca y contrata servicios profesionales a través de la Plataforma.</li>
                <li><strong>Profesional:</strong> usuario que ofrece sus servicios a través de la Plataforma.</li>
                <li><strong>Empresa:</strong> usuario que accede a la base de datos de currículums para reclutamiento.</li>
                <li><strong>Servicio:</strong> prestación ofrecida por un Profesional a un Cliente.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Naturaleza de la Plataforma</h2>
              <p>
                MiProfesional es exclusivamente una plataforma de intermediación tecnológica. 
                La Plataforma no presta, ofrece, ni ejecuta servicios profesionales de ningún tipo. 
                El rol de MiProfesional se limita a facilitar el contacto entre Clientes y Profesionales.
              </p>
              <p className="mt-2">
                MiProfesional no es parte de la relación contractual que se genere entre Cliente y Profesional. 
                La Plataforma no interviene en la negociación, ejecución, pago o postventa de los servicios acordados.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Aceptación de los Términos</h2>
              <p>
                Al registrarse y utilizar la Plataforma, el Usuario declara haber leído, entendido y aceptado 
                la totalidad de los presentes Términos y Condiciones. La aceptación es obligatoria e 
                irrevocable para el uso de cualquier funcionalidad de MiProfesional.
              </p>
              <p className="mt-2">
                Si el Usuario no está de acuerdo con estos términos, deberá abstenerse de registrarse y 
                utilizar la Plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Registro y Cuenta</h2>
              <p>Para utilizar la Plataforma, el Usuario debe:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Proporcionar información veraz, precisa y completa.</li>
                <li>Mantener la confidencialidad de sus credenciales de acceso.</li>
                <li>Ser mayor de 18 años o contar con autorización legal.</li>
                <li>Aceptar expresamente estos Términos y Condiciones.</li>
              </ul>
              <p className="mt-2">
                El Usuario es el único responsable de la actividad que ocurra en su cuenta.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Planes y Suscripciones</h2>
              <p>MiProfesional ofrece los siguientes planes:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li><strong>Plan Gratuito (Cliente):</strong> acceso gratuito para búsqueda de profesionales y gestión de CV propio.</li>
                <li><strong>Plan Profesional:</strong> suscripción mensual de $5.000 ARS para profesionales que deseen ofrecer sus servicios en la Plataforma.</li>
                <li><strong>Plan Empresa:</strong> suscripción mensual de $20.000 ARS para empresas que requieran acceso a la base de currículums.</li>
              </ul>
              <p className="mt-2">
                Las suscripciones se renuevan automáticamente. El Usuario puede cancelar en cualquier momento. 
                La falta de pago resultará en la suspensión del acceso a las funcionalidades premium.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Limitación de Responsabilidad</h2>
              <p>
                MiProfesional no será responsable por:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>La calidad, idoneidad o veracidad de los servicios ofrecidos por los Profesionales.</li>
                <li>El cumplimiento de obligaciones contractuales entre Clientes y Profesionales.</li>
                <li>Daños, perjuicios o pérdidas derivadas de la relación entre Usuarios.</li>
                <li>La exactitud de la información publicada por los Usuarios en sus perfiles.</li>
                <li>Interrupciones del servicio por mantenimiento, fallos técnicos o caso fortuito.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Privacidad y Datos Personales</h2>
              <p>
                MiProfesional trata los datos personales de acuerdo con su Política de Privacidad. 
                Los datos proporcionados por los Usuarios serán utilizados exclusivamente para los fines 
                de la Plataforma y no serán compartidos con terceros sin consentimiento expreso.
              </p>
              <p className="mt-2">
                El Usuario consente el tratamiento de sus datos personales en los términos de la 
                Ley 25.326 de Protección de Datos Personales de la República Argentina.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Suspensión y Baja</h2>
              <p>
                MiProfesional se reserva el derecho de suspender o cancelar cuentas que:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Infrinjan estos Términos y Condiciones.</li>
                <li>Proporcionen información falsa o engañosa.</li>
                <li>Realicen actividades fraudulentas o ilícitas.</li>
                <li>Incumplan con las obligaciones de pago de suscripciones.</li>
              </ul>
              <p className="mt-2">
                El Usuario puede solicitar la baja de su cuenta en cualquier momento contactando al soporte de la Plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">9. Propiedad Intelectual</h2>
              <p>
                Todos los derechos de propiedad intelectual sobre la Plataforma, su diseño, código, 
                marca y contenido son propiedad de MiProfesional. Queda prohibida la reproducción, 
                distribución o modificación no autorizada.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">10. Legislación Aplicable</h2>
              <p>
                Estos Términos y Condiciones se rigen por las leyes de la República Argentina. 
                Toda controversia será sometida a los tribunales ordinarios de la Ciudad Autónoma de Buenos Aires.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">11. Modificaciones</h2>
              <p>
                MiProfesional se reserva el derecho de modificar estos Términos y Condiciones en 
                cualquier momento. Las modificaciones serán comunicadas a los Usuarios a través de 
                la Plataforma. El uso continuado de la Plataforma implicará la aceptación de las modificaciones.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">12. Contacto</h2>
              <p>
                Para consultas sobre estos Términos y Condiciones, contactar a través de los canales 
                de soporte disponibles en la Plataforma.
              </p>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <Link to="/register" className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium text-sm">
              <ArrowLeft size={16} /> Volver al registro
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
