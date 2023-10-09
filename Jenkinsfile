//helpers  

def builds = [
]


def cancelOnCiSkip(boolean override = false) {
    if (sh(script: "git log -1 --pretty=%B | fgrep -ie '[ci-skip]'", returnStatus: true) == 0 && !override) {
        currentBuild.result = 'NOT_BUILT'
        error 'Aborting because commit message contains [ci-skip]'
    }
}

def artifactInfo

def whiteSourceConfigOptions = ['npm.yarnProject=false', 'npm.resolveLockFile=true', 'npm.runPreStep=true', 'npm.resolveDependencies=true', 'html.resolveDependencies=false', 'excludes=**/demo/**/* **/test/**/* **/*.swf **/*.scala **/*.jsm **/*.ls **/*.cc **/*.tar.gz **/*.c **/*.tgz **/*.el **/*.go **/*.h **/*.py **/*.rb **/*.exe **/*.sh **/*.coffee **/*.gemspec **/*.pl **/*.rake **/*.so **/*.apk **/*.watchr **/*.gyp'];

def whitesourceOrg(String branchName) { "${branchName == 'main' ? 'online-release' : 'online-dev'}";}

def cleanUpAndUnstash(){
  deleteDir()
  unstash 'dist'
  unstash 'manifests'
}


//actual Pipeline stuff

stage('Checkout & Pipeline Name') {
    node('Linux') {
        currentBuild.displayName = "#${BUILD_NUMBER} - branch: ${BRANCH_NAME}"
        deleteDir()
        checkout scm
        cancelOnCiSkip()
        stash name: 'workspace_scm', useDefaultExcludes: false
    }
}


pipeline {
  agent none
  options {
      buildDiscarder(logRotator(numToKeepStr: '10'))
      timestamps()
      timeout(time: 60, unit: 'MINUTES')
      skipDefaultCheckout()
      skipStagesAfterUnstable()
      preserveStashes()
      disableConcurrentBuilds()
      gitLabConnection('git.datev.de')
      gitlabBuilds(builds: builds)
  }

  triggers {
    gitlab(
        triggerOnPush: true,
        triggerOnMergeRequest: true,
        pendingBuildName: 'Jenkins',
        cancelPendingBuildsOnUpdate: true,
        ciSkip: true
    )
  }

  stages{
    stage('Whitesource Scan') {
      when {
        anyOf { branch 'dev'; branch 'main' }
        beforeAgent true
      }
      agent { label 'Linux' }
      steps{
        deleteDir()
        unstash 'workspace_scm'
        withNpmEnv {
          whitesourceScan(
              configOpts: whiteSourceConfigOptions,
              whitesourceOrg: whitesourceOrg(env.BRANCH_NAME)
          )
        }
      }
    }

    stage('Build'){
      agent  { label 'Linux' }
      environment {
        PATH = "${tool('nodejs')}/bin:$PATH"
        SONAR_SCANNER = "${tool('SonarQube-Scanner')}/bin/sonar-scanner"

        PUBLISH_DIR = 'dist/'
        REPORT_PATH = 'src/assets/licenses/NOTICE.html'
      }
      stages{
        stage('Prepare Workspace'){
          steps{
            deleteDir()
            unstash 'workspace_scm'          
            withNpmEnv {
                sh 'npm ci'
            }
          }
        }

        stage('npm Build'){
          steps{
            configFileProvider([configFile(fileId: 'npm-mirror', targetLocation: '.npmrc')]) {
              sh "npm run build"
            }
            stash name: 'dist', includes: 'dist/**', useDefaultExcludes: false
            stash name: 'manifests', includes: 'manifests/manifest-*.yml'
          }
        }
      }
    }
    stage('Deploy'){
      agent none
      stages{
        stage('Publish App Dev intra'){
          when {
              branch 'main'
              beforeAgent true
          }
          agent { label 'Linux' }
          environment {
              ORG_NAME = 'IDVBasis'
              SPACE_NAME = 'playground'
              CREDENTIALS_ID = 'TU11222'
              CLOUD_FOUNDRY_URL = 'https://deployment.pcfapps.dev.datev.de/'
              MANIFEST_FILE = "./manifests/manifest-dev-intra.yml"
          }
          steps{
            cleanUpAndUnstash()
            withCfLogin url: CLOUD_FOUNDRY_URL, credentialsId: CREDENTIALS_ID, org: ORG_NAME, space: SPACE_NAME, {
                sh "cf push -f ${MANIFEST_FILE} --strategy rolling"
            }
          }
        }   
      
      }
    }
  }
}
