const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

// Middleware
app.use(express.json());
app.use(express.static('.'));

// Data storage file
const DATA_FILE = 'userdata.json';

// Initialize data file if it doesn't exist
function initializeDataFile() {
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify({}));
        console.log('✅ Created data storage file');
    }
}

// Read all user data
function readAllUserData() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.log('Error reading data file:', error);
        return {};
    }
}

// Write user data
function writeUserData(username, todos) {
    try {
        const allData = readAllUserData();
        allData[username] = todos;
        fs.writeFileSync(DATA_FILE, JSON.stringify(allData, null, 2));
        return true;
    } catch (error) {
        console.log('Error writing data file:', error);
        return false;
    }
}

// Initialize data file
initializeDataFile();

// Serve the landing page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve the todo app
app.get('/app.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'app.html'));
});

// API to get todos for a user
app.get('/api/todos/:username', (req, res) => {
    const { username } = req.params;
    const allData = readAllUserData();
    const userTodos = allData[username] || [];
    res.json(userTodos);
});

// API to save todos for a user
app.post('/api/todos/:username', (req, res) => {
    const { username } = req.params;
    const { todos } = req.body;
    
    if (writeUserData(username, todos)) {
        res.json({ success: true, message: 'Todos saved successfully' });
    } else {
        res.status(500).json({ success: false, error: 'Failed to save todos' });
    }
});

// Raw Data Webpage - View all user data
app.get('/raw-data', (req, res) => {
    const allData = readAllUserData();
    const users = Object.keys(allData);
    const totalTodos = users.reduce((sum, user) => sum + (allData[user]?.length || 0), 0);
    const totalCompleted = users.reduce((sum, user) => 
        sum + (allData[user]?.filter(todo => todo.completed).length || 0), 0
    );

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>SparkTask Pro - Raw Data</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }
            body { 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                padding: 20px;
            }
            .container { 
                max-width: 1200px; 
                margin: 0 auto; 
                background: white; 
                padding: 30px; 
                border-radius: 15px; 
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .header h1 {
                font-size: 2.5em;
                margin-bottom: 10px;
                background: linear-gradient(45deg, #667eea, #764ba2);
                -webkit-background-clip: text;
                background-clip: text;
                color: transparent;
            }
            .back-btn {
                background: #667eea;
                color: white;
                padding: 12px 25px;
                border: none;
                border-radius: 25px;
                cursor: pointer;
                text-decoration: none;
                display: inline-flex;
                align-items: center;
                gap: 8px;
                font-weight: 600;
                transition: all 0.3s;
                margin-bottom: 20px;
            }
            .back-btn:hover {
                background: #5a6fd8;
                transform: translateY(-2px);
            }
            .refresh-btn {
                background: #4ECDC4;
                color: white;
                padding: 12px 25px;
                border: none;
                border-radius: 25px;
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                gap: 8px;
                font-weight: 600;
                transition: all 0.3s;
                margin-bottom: 20px;
                margin-left: 10px;
            }
            .refresh-btn:hover {
                background: #3bb5ac;
                transform: translateY(-2px);
            }
            .stats-bar {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin-bottom: 30px;
            }
            .stat-card {
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                padding: 20px;
                border-radius: 10px;
                text-align: center;
            }
            .stat-number {
                font-size: 2em;
                font-weight: bold;
            }
            .user-section {
                margin: 25px 0;
                padding: 20px;
                background: #f8f9fa;
                border-radius: 10px;
                border-left: 5px solid #4ECDC4;
            }
            .user-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
                padding-bottom: 10px;
                border-bottom: 2px solid #e9ecef;
            }
            .user-header h2 {
                color: #2d3748;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .user-stats {
                display: flex;
                gap: 15px;
                font-size: 0.9em;
            }
            .stat-badge {
                background: white;
                padding: 5px 10px;
                border-radius: 15px;
                font-weight: 600;
            }
            pre {
                background: #2d3748;
                color: #e2e8f0;
                padding: 20px;
                border-radius: 8px;
                overflow: auto;
                max-height: 400px;
                font-size: 0.85em;
                border: 1px solid #4a5568;
            }
            .no-data {
                text-align: center;
                padding: 40px;
                color: #6c757d;
            }
            .no-data i {
                font-size: 3em;
                margin-bottom: 15px;
                opacity: 0.5;
            }
            .last-updated {
                text-align: center;
                color: #6c757d;
                margin-top: 20px;
                font-size: 0.9em;
            }
            .action-buttons {
                display: flex;
                gap: 10px;
                margin-bottom: 20px;
            }
        </style>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1><i class="fas fa-database"></i> SparkTask Pro - Raw Data</h1>
                <p>View all user data stored in the system</p>
            </div>

            <div class="action-buttons">
                <a href="/" class="back-btn">
                    <i class="fas fa-arrow-left"></i> Back to Main App
                </a>
                <button class="refresh-btn" onclick="loadData()">
                    <i class="fas fa-sync-alt"></i> Refresh Data
                </button>
            </div>

            <div class="stats-bar">
                <div class="stat-card">
                    <div class="stat-number" id="totalUsers">${users.length}</div>
                    <div>Total Users</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="totalTodos">${totalTodos}</div>
                    <div>Total Todos</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="totalCompleted">${totalCompleted}</div>
                    <div>Completed Todos</div>
                </div>
            </div>

            <div id="dataContainer">
                ${users.length === 0 ? `
                    <div class="no-data">
                        <i class="fas fa-inbox"></i>
                        <h3>No Data Found</h3>
                        <p>No user data found. Users need to register and add todos first.</p>
                    </div>
                ` : users.map(user => {
                    const userTodos = allData[user] || [];
                    const completed = userTodos.filter(todo => todo.completed).length;
                    const pending = userTodos.length - completed;
                    return `
                        <div class="user-section">
                            <div class="user-header">
                                <h2><i class="fas fa-user"></i> User: ${user}</h2>
                                <div class="user-stats">
                                    <span class="stat-badge" style="background: #4ECDC4; color: white;">${userTodos.length} Total</span>
                                    <span class="stat-badge" style="background: #51cf66; color: white;">${completed} Completed</span>
                                    <span class="stat-badge" style="background: #FFD93D; color: black;">${pending} Pending</span>
                                </div>
                            </div>
                            <pre>${JSON.stringify(userTodos, null, 2)}</pre>
                        </div>
                    `;
                }).join('')}
            </div>

            <div class="last-updated" id="lastUpdated">
                Last updated: ${new Date().toLocaleString()}
            </div>
        </div>

        <script>
            function loadData() {
                location.reload();
            }
            
            // Auto-refresh every 10 seconds
            setInterval(loadData, 10000);
        </script>
    </body>
    </html>
    `;
    res.send(html);
});

// API endpoint to get all raw data
app.get('/api/raw-data', (req, res) => {
    const allData = readAllUserData();
    const users = Object.keys(allData);
    const totalTodos = users.reduce((sum, user) => sum + (allData[user]?.length || 0), 0);
    
    res.json({
        success: true,
        timestamp: new Date().toISOString(),
        total_users: users.length,
        total_todos: totalTodos,
        data: allData
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    const allData = readAllUserData();
    const users = Object.keys(allData);
    
    res.json({ 
        status: 'OK', 
        message: 'SparkTask Pro Server is running!',
        timestamp: new Date().toISOString(),
        data_stats: {
            total_users: users.length,
            total_todos: users.reduce((sum, user) => sum + (allData[user]?.length || 0), 0)
        },
        endpoints: {
            main_app: '/',
            todo_app: '/app.html',
            raw_data: '/raw-data',
            api_data: '/api/raw-data',
            health: '/health'
        }
    });
});

// Start server with beautiful logging
app.listen(PORT, () => {
    console.log('\n✨ ========================================');
    console.log('🚀 SparkTask Pro Started Successfully!');
    console.log('✨ ========================================');
    console.log('📍 Landing Page:  http://localhost:' + PORT);
    console.log('📱 Todo App:      http://localhost:' + PORT + '/app.html');
    console.log('📊 Raw Data Page: http://localhost:' + PORT + '/raw-data');
    console.log('🔧 API Data:      http://localhost:' + PORT + '/api/raw-data');
    console.log('❤️  Health Check:  http://localhost:' + PORT + '/health');
    console.log('✨ ========================================');
    console.log('\n💾 Data Storage: Using file-based storage (userdata.json)');
    console.log('🔄 Raw Data Page: Auto-refreshes every 10 seconds');
    console.log('📈 Real Stats: Now shows actual user counts and todos');
    console.log('\n🚀 Ready to use! Open your browser to get started!\n');
});