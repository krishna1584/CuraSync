'use client';

import { useState } from 'react';

export default function TestSignupPage() {
  const [result, setResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testDoctorSignup = async () => {
    setIsLoading(true);
    setResult('Testing doctor signup...');
    
    try {
      const testData = {
        name: 'Dr. Test Doctor',
        email: 'test.doctor@example.com',
        password: 'password123',
        role: 'doctor',
        phone: '1234567890',
        gender: 'male',
        specialization: 'Cardiology',
        licenseNumber: 'DOC123456'
      };

      console.log('Sending request with data:', testData);

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });

      const data = await response.json();
      console.log('Response:', data);

      setResult(`
Status: ${response.status}
Success: ${data.success}
Message: ${data.message}
Error: ${data.error || 'None'}
Data: ${JSON.stringify(data.data || {}, null, 2)}
      `);

    } catch (error) {
      console.error('Error:', error);
      setResult(`Network Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testPatientSignup = async () => {
    setIsLoading(true);
    setResult('Testing patient signup...');
    
    try {
      const testData = {
        name: 'Test Patient',
        email: 'test.patient@example.com',
        password: 'password123',
        role: 'patient',
        phone: '1234567890',
        gender: 'female'
      };

      console.log('Sending request with data:', testData);

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });

      const data = await response.json();
      console.log('Response:', data);

      setResult(`
Status: ${response.status}
Success: ${data.success}
Message: ${data.message}
Error: ${data.error || 'None'}
Data: ${JSON.stringify(data.data || {}, null, 2)}
      `);

    } catch (error) {
      console.error('Error:', error);
      setResult(`Network Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Signup Test Page</h1>
        
        <div className="space-y-4 mb-8">
          <button
            onClick={testPatientSignup}
            disabled={isLoading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Testing...' : 'Test Patient Signup'}
          </button>
          
          <button
            onClick={testDoctorSignup}
            disabled={isLoading}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 ml-4"
          >
            {isLoading ? 'Testing...' : 'Test Doctor Signup'}
          </button>
        </div>

        {result && (
          <div className="bg-gray-100 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Result:</h3>
            <pre className="whitespace-pre-wrap text-sm">{result}</pre>
          </div>
        )}

        <div className="mt-8 bg-yellow-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Instructions:</h3>
          <ol className="list-decimal list-inside space-y-2">
            <li>Open browser developer tools (F12)</li>
            <li>Go to the Network tab</li>
            <li>Click on a test button</li>
            <li>Check both the console and network responses for errors</li>
            <li>Look at the server terminal for any backend errors</li>
          </ol>
        </div>
      </div>
    </div>
  );
}