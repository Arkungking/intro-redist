import { Router } from "express";
import { SampleController } from "./sample.controller";
import { validateBody } from "../../middlewares/validation.middleware";
import { CreateSampleDTO } from "./dto/create-sample.dto";
import { UploaderMiddlwarre } from "../../middlewares/uploader.middleware";

export class SampleRouter {
  private router: Router;
  private sampleController: SampleController;
  private uploaderMiddleware: UploaderMiddlwarre;

  constructor() {
    this.router = Router();
    this.sampleController = new SampleController();
    this.uploaderMiddleware = new UploaderMiddlwarre();
    this.initializedRoutes();
  }

  private initializedRoutes = () => {
    this.router.get("/", this.sampleController.getSamples);
    this.router.get("/:id", this.sampleController.getSample);
    this.router.post(
      "/",
      this.uploaderMiddleware.upload().fields([{ name: "image", maxCount: 1 }]),
      this.uploaderMiddleware.fileFIlter(["image/jpeg", "image/png"]),
      validateBody(CreateSampleDTO),
      this.sampleController.createSample
    );
  };

  getRouter = () => {
    return this.router;
  };
}
