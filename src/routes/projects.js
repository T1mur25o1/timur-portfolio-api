import { createCollectionRouter } from "./collectionFactory.js";
import { schemas } from "../validate.js";

export default createCollectionRouter("projects", schemas.project);
