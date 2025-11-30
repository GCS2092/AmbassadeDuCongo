import React, { useState, useEffect } from 'react'
import { api } from '../lib/api'

interface DiagnosticResult {
  test: string
  status: 'success' | 'error' | 'warning'
  message: string
  details?: any
}

export default function NetworkDiagnostic() {
  const [results, setResults] = useState<DiagnosticResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [currentIP, setCurrentIP] = useState('')

  useEffect(() => {
    // Détecter l'IP actuelle
    detectCurrentIP()
  }, [])

  const detectCurrentIP = async () => {
    try {
      // Essayer de détecter l'IP via différentes méthodes
      const response = await fetch('http://192.168.1.2:8000/api/', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        setCurrentIP('192.168.1.2')
      }
    } catch (error) {
      // Essayer localhost
      try {
        const response = await fetch('http://localhost:8000/api/', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        })
        
        if (response.ok) {
          setCurrentIP('localhost')
        }
      } catch (error2) {
        setCurrentIP('Inconnue')
      }
    }
  }

  const runDiagnostics = async () => {
    setIsRunning(true)
    const newResults: DiagnosticResult[] = []

    // Test 1: Vérifier l'environnement
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    const isHTTPS = window.location.protocol === 'https:'
    const userAgent = navigator.userAgent
    
    newResults.push({
      test: 'Environnement',
      status: 'success',
      message: `Mobile: ${isMobile ? 'Oui' : 'Non'}, HTTPS: ${isHTTPS ? 'Oui' : 'Non'}`,
      details: { userAgent, isMobile, isHTTPS }
    })

    // Test 2: Configuration API
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
    newResults.push({
      test: 'Configuration API',
      status: 'success',
      message: `URL API: ${apiBaseUrl}`,
      details: { apiBaseUrl }
    })

    // Test 3: Test de connectivité backend directe
    try {
      const backendUrl = apiBaseUrl.replace('/api', '')
      const response = await fetch(`${backendUrl}/api/`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      
      newResults.push({
        test: 'Backend Direct',
        status: 'success',
        message: `Backend accessible: ${response.status} ${response.statusText}`,
        details: { 
          url: `${backendUrl}/api/`,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        }
      })
    } catch (error: any) {
      newResults.push({
        test: 'Backend Direct',
        status: 'error',
        message: `Erreur de connexion: ${error.message}`,
        details: { 
          error: error.message,
          name: error.name,
          stack: error.stack
        }
      })
    }

    // Test 4: Test avec Axios (comme l'app)
    try {
      const response = await api.get('/')
      newResults.push({
        test: 'API Axios',
        status: 'success',
        message: `API Axios fonctionne: ${response.status}`,
        details: { 
          status: response.status,
          data: response.data
        }
      })
    } catch (error: any) {
      newResults.push({
        test: 'API Axios',
        status: 'error',
        message: `Erreur API Axios: ${error.message}`,
        details: { 
          error: error.message,
          response: error.response?.data,
          status: error.response?.status,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            baseURL: error.config?.baseURL
          }
        }
      })
    }

    // Test 5: Test de login (si possible)
    try {
      const loginData = {
        email: 'slovengama@gmail.com',
        password: 'Admin123!'
      }
      
      const response = await fetch(`${apiBaseUrl}/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData)
      })
      
      if (response.ok) {
        newResults.push({
          test: 'Login Test',
          status: 'success',
          message: 'Login fonctionne correctement',
          details: { status: response.status }
        })
      } else {
        newResults.push({
          test: 'Login Test',
          status: 'warning',
          message: `Login échoué: ${response.status} ${response.statusText}`,
          details: { 
            status: response.status,
            statusText: response.statusText,
            response: await response.text()
          }
        })
      }
    } catch (error: any) {
      newResults.push({
        test: 'Login Test',
        status: 'error',
        message: `Erreur login: ${error.message}`,
        details: { error: error.message }
      })
    }

    // Test 6: Vérifier les cookies et le stockage local
    try {
      const hasLocalStorage = typeof(Storage) !== "undefined"
      const hasSessionStorage = typeof(Storage) !== "undefined"
      const cookies = document.cookie
      
      newResults.push({
        test: 'Stockage Local',
        status: 'success',
        message: `LocalStorage: ${hasLocalStorage ? 'Oui' : 'Non'}, Cookies: ${cookies ? 'Oui' : 'Non'}`,
        details: { 
          hasLocalStorage,
          hasSessionStorage,
          cookies: cookies || 'Aucun cookie'
        }
      })
    } catch (error: any) {
      newResults.push({
        test: 'Stockage Local',
        status: 'error',
        message: `Erreur stockage: ${error.message}`,
        details: { error: error.message }
      })
    }

    // Test 7: Vérifier les permissions réseau
    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'camera' as PermissionName })
        newResults.push({
          test: 'Permissions',
          status: 'success',
          message: `Permissions: ${permission.state}`,
          details: { state: permission.state }
        })
      } catch (error: any) {
        newResults.push({
          test: 'Permissions',
          status: 'warning',
          message: `Permissions non disponibles: ${error.message}`,
          details: { error: error.message }
        })
      }
    }

    setResults(newResults)
    setIsRunning(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100'
      case 'error': return 'text-red-600 bg-red-100'
      case 'warning': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅'
      case 'error': return '❌'
      case 'warning': return '⚠️'
      default: return 'ℹ️'
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          🔍 Diagnostic Réseau Mobile
        </h2>
        <p className="text-gray-600">
          IP détectée: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{currentIP}</span>
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Ce diagnostic vous aide à identifier les problèmes de connectivité sur votre téléphone.
        </p>
      </div>

      <div className="mb-6">
        <button
          onClick={runDiagnostics}
          disabled={isRunning}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isRunning ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Diagnostic en cours...
            </>
          ) : (
            <>
              🚀 Lancer le diagnostic
            </>
          )}
        </button>
      </div>

      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Résultats du diagnostic</h3>
          
          {results.map((result, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-lg">{getStatusIcon(result.status)}</span>
                <h4 className="font-medium text-gray-900">{result.test}</h4>
                <span className={`px-2 py-1 rounded text-sm ${getStatusColor(result.status)}`}>
                  {result.status}
                </span>
              </div>
              
              <p className="text-gray-700 mb-2">{result.message}</p>
              
              {result.details && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                    Voir les détails
                  </summary>
                  <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">💡 Solutions recommandées</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Vérifiez que vous êtes sur le même réseau WiFi que l'ordinateur</li>
              <li>• Essayez de désactiver temporairement l'antivirus/firewall</li>
              <li>• Testez avec un autre navigateur mobile (Chrome, Firefox, Safari)</li>
              <li>• Vérifiez que les serveurs sont démarrés avec l'IP correcte</li>
              <li>• Si HTTPS requis, utilisez le script start_https_servers.ps1</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
