# Getting Started

Welcome to your new project.

It contains these folders and files, following our recommended project layout:

File or Folder | Purpose
---------|----------
`app/` | content for UI frontends goes here
`db/` | your domain models and data go here
`srv/` | your service models and code go here
`package.json` | project metadata and configuration
`readme.md` | this getting started guide


## Next Steps

- Open a new terminal and run `cds watch` 
- (in VS Code simply choose _**Terminal** > Run Task > cds watch_)
- Start adding content, for example, a [db/schema.cds](db/schema.cds).


## Learn More

Learn more at https://cap.cloud.sap/docs/get-started/.


mbt build -t gen --mtar mta.tar
cf deploy gen/mta.tar 


cf undeploy scheduler --delete-services
cf update-service scheduler-auth -c xs-security.json
npm add @sap-cloud-sdk/http-client@3.x @sap-cloud-sdk/util@3.x @sap-cloud-sdk/connectivity@3.x

    "destinations": "[{\"name\":\"SFapi\",\"proxyHost\":\"http://127.0.0.1\",\"proxyPort\":8887,\"url\":\"http://SFapi.dest\"}]"