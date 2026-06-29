import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    leader: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
    team: {
      type: [mongoose.Types.ObjectId],
      ref: "User",
    },
    createdBy: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

projectSchema.virtual("leads", {
  ref: "Lead",
  foreignField: "project",
  localField: "_id",
});

projectSchema.set("toJSON", { virtuals: true });
projectSchema.set("toObject", { virtuals: true });

const Project = mongoose.model("Project", projectSchema);

export default Project;
