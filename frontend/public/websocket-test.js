// WebSocket Test and Debug Script
// Run this in browser console to test WebSocket connection

console.log('🚀 Starting WebSocket Test...');

// Test WebSocket connection
const testSocket = io('http://localhost:5000');

testSocket.on('connect', () => {
  console.log('✅ WebSocket Connected:', testSocket.id);
  
  // Test user registration
  testSocket.emit('register', {
    userId: 'test-doctor-123',
    role: 'doctor', 
    name: 'Test Doctor'
  });
  
  console.log('📝 Registered test doctor');
});

testSocket.on('disconnect', () => {
  console.log('❌ WebSocket Disconnected');
});

// Listen for appointment notifications
testSocket.on('appointment_notification', (data) => {
  console.log('🔔 Appointment Notification Received:', data);
});

testSocket.on('appointment_update', (data) => {
  console.log('📊 Appointment Update Received:', data);
});

// Test appointment creation (simulate backend notification)
setTimeout(() => {
  console.log('🧪 Testing notification emission...');
  
  testSocket.emit('test_notification', {
    type: 'new_appointment',
    message: 'Test appointment notification',
    timestamp: new Date().toISOString()
  });
}, 2000);

console.log('🎯 WebSocket test setup complete. Check console for results.');

// Add to window for manual testing
window.testSocket = testSocket;
window.testNotification = () => {
  testSocket.emit('register', {
    userId: 'manual-test-' + Date.now(),
    role: 'doctor',
    name: 'Manual Test Doctor'
  });
};