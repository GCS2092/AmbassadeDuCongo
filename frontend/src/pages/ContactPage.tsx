import { FiMail, FiPhone, FiMapPin, FiClock } from 'react-icons/fi'

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Contact</h1>
        <p className="text-xl text-gray-600">
          Nous sommes à votre disposition pour toute question
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Contact Information */}
        <div className="space-y-8">
          <div className="card">
            <h2 className="text-2xl font-bold mb-6">
              Ambassade de la République du Congo
            </h2>
            
            <div className="space-y-6">
              <ContactItem
                icon={<FiMapPin size={24} />}
                title="Adresse"
                content={
                  <>
                    Stèle Mermoz, Pyrotechnie<br />
                    P.O. Box 5243<br />
                    Dakar, Sénégal
                  </>
                }
              />
              
              <ContactItem
                icon={<FiPhone size={24} />}
                title="Téléphones"
                content={
                  <>
                    +221 824 8398<br />
                    +221 649 3117
                  </>
                }
              />
              
              <ContactItem
                icon={<FiMail size={24} />}
                title="Email"
                content="contact@ambassade-congo.sn"
              />
              
              <ContactItem
                icon={<FiClock size={24} />}
                title="Horaires"
                content={
                  <>
                    Lundi - Vendredi: 9h00 - 17h00<br />
                    Samedi: 9h00 - 13h00<br />
                    Dimanche: Fermé
                  </>
                }
              />
            </div>
          </div>

          {/* Important Services */}
          <div className="card bg-yellow-50">
            <h3 className="text-xl font-bold mb-4">Services aux étrangers</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">
                  Direction de la Police des Étrangers et des Titres de Voyage (DPETV)
                </h4>
                <p className="text-sm text-gray-700 mb-3">
                  Pour vos cartes de circulation, titres de séjour et documents de voyage
                </p>
                <div className="space-y-1 text-sm">
                  <p><strong>Adresse:</strong> Dieuppeul, Allées Sérigne Ababacar Sy, Dakar</p>
                  <p><strong>Téléphones:</strong> 33 869 30 01 / 33 864 51 26</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Map Placeholder */}
        <div className="card">
          <h3 className="text-2xl font-bold mb-4">Localisation</h3>
          <div className="bg-gray-200 rounded-lg h-96 flex items-center justify-center">
            <p className="text-gray-600">
              Carte interactive<br />
              Stèle Mermoz, Dakar
            </p>
          </div>
          <div className="mt-4">
            <a
              href="https://maps.google.com/?q=Stèle Mermoz, Pyrotechnie, Dakar"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary w-full text-center block"
            >
              Ouvrir dans Google Maps
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

function ContactItem({ icon, title, content }: any) {
  return (
    <div className="flex items-start space-x-4">
      <div className="text-primary-500 mt-1">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold mb-1">{title}</h3>
        <div className="text-gray-600">{content}</div>
      </div>
    </div>
  )
}

