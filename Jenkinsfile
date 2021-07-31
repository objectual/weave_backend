#!groovy

/*
The MIT License
Copyright (c) 2015-, CloudBees, Inc., and a number of other of contributors
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.
        THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/
pipeline {
    agent any
    stages {
        stage('Deploy') {
                parallel {
                    // stage('Heroku Deployment') {
                    //     steps {
                    //         echo 'Push to Heroku Repo'
                    //         withCredentials([
                    //             usernamePassword(
                    //                 credentialsId: 'heroku',
                    //                 usernameVariable: 'USER',
                    //                 passwordVariable: 'PASS'
                    //             )]) {
                    //                 sh 'git push https://$USER:$PASS@git.heroku.com/iweave.git HEAD:master'
                    //             }
                    //     }
                    // }

                    // stage('Cloud Deployment For Development') {
                    //     when {
                    //         branch 'development'
                    //     }
                    //     steps {
                    //         script {
                    //             try {
                    //             echo 'Deploying Code'
                    //             withCredentials([
                    //                     usernamePassword(
                    //                         credentialsId: 'git-ITSOL',
                    //                         usernameVariable: 'USER',
                    //                         passwordVariable: 'PASS'
                    //                     )]) {
                    //                         sshagent (credentials: ['Cloud-Admin']) {
                    //                             sh 'ssh -o StrictHostKeyChecking=no root@46.101.87.98 "bash dev-pull.sh $USER $PASS "'
                    //                             sh 'ssh -o StrictHostKeyChecking=no root@46.101.87.98 "bash pm2run.sh weave_dev"'
                    //                         }
                    //                     }
                    //             } catch (err) {
                    //             sh 'Could not connect to HOST'
                    //             }
                    //         }
                    //     }
                    // }
                stage('Cloud Deployment For Production') {
                        when {
                            branch 'master'
                        }
                        steps {
                            script {
                                try {
                                echo 'Deploying Code'
                                withCredentials([
                                        usernamePassword(
                                            credentialsId: 'git-ITSOL',
                                            usernameVariable: 'USER',
                                            passwordVariable: 'PASS'
                                        )]) {
                                            sshagent (credentials: ['Cloud-Admin']) {
                                                sh 'ssh -o StrictHostKeyChecking=no root@46.101.87.98 "bash master-pull.sh $USER $PASS "'
                                                sh 'ssh -o StrictHostKeyChecking=no root@46.101.87.98 "bash pm2run.sh weave"'
                                            }
                                        }
                                } catch (err) {
                                sh 'Could not connect to HOST'
                                }
                            }
                        }
                }
                }
        }
    }
    post {
       // only triggered when blue or green sign
       success {
           slackSend color: "good", message: "[Weave CI] Code deployed and processes restarted 👍 
           1. [Prisma Dev Studio](http://46.101.87.98:5555/)
           2. [Project URI](https://dev.iweave.com)
           3. [Portainer](http://46.101.87.98:5000/)"
       }
       // triggered when red sign
       failure {
           slackSend color: "danger", message: "[Weave CI] Opps. Something's wrong with the deployment. 😢"
       }
       // trigger every-works
       always {
           slackSend color: "warning", message: "[Weave CI] All done with my job 💪"
       }
    }
}
