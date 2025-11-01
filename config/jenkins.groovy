#!/usr/bin/env groovy
/**
 * Jenkins Pipeline for Scriptify AI
 * Automated test execution and reporting
 */

pipeline {
    agent any
    
    parameters {
        choice(
            name: 'BROWSER',
            choices: ['chromium', 'firefox', 'webkit'],
            description: 'Browser to use for tests'
        )
        booleanParam(
            name: 'HEADLESS',
            defaultValue: true,
            description: 'Run tests in headless mode'
        )
        choice(
            name: 'TEST_SUITE',
            choices: ['all', 'smoke', 'regression'],
            description: 'Test suite to run'
        )
        booleanParam(
            name: 'GENERATE_REPORT',
            defaultValue: true,
            description: 'Generate Allure report'
        )
        booleanParam(
            name: 'SEND_NOTIFICATION',
            defaultValue: true,
            description: 'Send notification on completion'
        )
    }
    
    environment {
        // Python environment
        PYTHON_VERSION = '3.9'
        VENV_PATH = "${WORKSPACE}/venv"
        
        // Test configuration
        BASE_URL = 'https://codeaurorix.preview.sqrxenterprise.com'
        ALLURE_RESULTS = 'allure-results'
        ALLURE_REPORT = 'allure-report'
        
        // Notification
        SLACK_CHANNEL = '#qa-team'
        EMAIL_RECIPIENTS = 'team@example.com'
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out source code...'
                checkout scm
            }
        }
        
        stage('Setup Environment') {
            steps {
                echo 'Setting up Python environment...'
                script {
                    // Create virtual environment
                    sh """
                        python${PYTHON_VERSION} -m venv ${VENV_PATH}
                        source ${VENV_PATH}/bin/activate
                        pip install --upgrade pip
                        pip install -r requirements.txt
                        playwright install ${params.BROWSER}
                    """
                }
            }
        }
        
        stage('Install Dependencies') {
            steps {
                echo 'Installing Node.js dependencies...'
                sh 'npm install'
            }
        }
        
        stage('Lint Code') {
            steps {
                echo 'Running code linting...'
                sh 'npm run lint'
            }
        }
        
        stage('Run Tests') {
            steps {
                echo 'Running Playwright tests...'
                script {
                    def testCommand = "source ${VENV_PATH}/bin/activate && python scripts/run_tests.py"
                    
                    if (params.BROWSER) {
                        testCommand += " --browser ${params.BROWSER}"
                    }
                    
                    if (params.HEADLESS) {
                        testCommand += " --headless"
                    }
                    
                    if (params.TEST_SUITE != 'all') {
                        testCommand += " --tags ${params.TEST_SUITE}"
                    }
                    
                    sh testCommand
                }
            }
        }
        
        stage('Generate Report') {
            when {
                expression { params.GENERATE_REPORT }
            }
            steps {
                echo 'Generating Allure report...'
                script {
                    sh """
                        source ${VENV_PATH}/bin/activate
                        python scripts/generate_report.py --results-dir ${ALLURE_RESULTS} --report-dir ${ALLURE_REPORT}
                    """
                }
            }
        }
        
        stage('Archive Results') {
            steps {
                echo 'Archiving test results...'
                script {
                    // Archive Allure results
                    if (fileExists(ALLURE_RESULTS)) {
                        archiveArtifacts artifacts: "${ALLURE_RESULTS}/**/*", fingerprint: true
                    }
                    
                    // Archive Allure report
                    if (fileExists(ALLURE_REPORT)) {
                        archiveArtifacts artifacts: "${ALLURE_REPORT}/**/*", fingerprint: true
                    }
                    
                    // Archive screenshots
                    if (fileExists('screenshots')) {
                        archiveArtifacts artifacts: 'screenshots/**/*', fingerprint: true
                    }
                    
                    // Archive videos
                    if (fileExists('videos')) {
                        archiveArtifacts artifacts: 'videos/**/*', fingerprint: true
                    }
                }
            }
        }
        
        stage('Publish Report') {
            when {
                expression { params.GENERATE_REPORT }
            }
            steps {
                echo 'Publishing Allure report...'
                script {
                    // Publish Allure report
                    allure([
                        includeProperties: false,
                        jdk: '',
                        properties: [],
                        reportBuildPolicy: 'ALWAYS',
                        results: [[path: ALLURE_RESULTS]]
                    ])
                }
            }
        }
    }
    
    post {
        always {
            echo 'Cleaning up workspace...'
            cleanWs()
        }
        
        success {
            echo 'Pipeline completed successfully!'
            script {
                if (params.SEND_NOTIFICATION) {
                    // Send success notification
                    slackSend(
                        channel: env.SLACK_CHANNEL,
                        color: 'good',
                        message: """
                        ✅ Scriptify AI Tests Passed!
                        
                        • Build: ${env.BUILD_NUMBER}
                        • Browser: ${params.BROWSER}
                        • Test Suite: ${params.TEST_SUITE}
                        • Report: ${env.BUILD_URL}allure/
                        """
                    )
                }
            }
        }
        
        failure {
            echo 'Pipeline failed!'
            script {
                if (params.SEND_NOTIFICATION) {
                    // Send failure notification
                    slackSend(
                        channel: env.SLACK_CHANNEL,
                        color: 'danger',
                        message: """
                        ❌ Scriptify AI Tests Failed!
                        
                        • Build: ${env.BUILD_NUMBER}
                        • Browser: ${params.BROWSER}
                        • Test Suite: ${params.TEST_SUITE}
                        • Logs: ${env.BUILD_URL}console
                        """
                    )
                }
            }
        }
        
        unstable {
            echo 'Pipeline completed with warnings!'
            script {
                if (params.SEND_NOTIFICATION) {
                    // Send unstable notification
                    slackSend(
                        channel: env.SLACK_CHANNEL,
                        color: 'warning',
                        message: """
                        ⚠️ Scriptify AI Tests Unstable!
                        
                        • Build: ${env.BUILD_NUMBER}
                        • Browser: ${params.BROWSER}
                        • Test Suite: ${params.TEST_SUITE}
                        • Report: ${env.BUILD_URL}allure/
                        """
                    )
                }
            }
        }
    }
}
