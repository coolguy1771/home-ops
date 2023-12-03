import * as pulumi from "@pulumi/pulumi";
import { setupMinio } from "./config/minio";

const cfg = new pulumi.Config()

setupMinio(cfg);
