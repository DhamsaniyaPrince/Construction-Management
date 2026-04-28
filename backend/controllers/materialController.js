const mongoose = require("mongoose");
const Material = require("../models/Material");
const asyncHandler = require("../utils/asyncHandler");

const validateObjectId = (id) =>
  mongoose.Types.ObjectId.isValid(id);

const getPagination = (query) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

/* ================================================= */

const requestMaterial = async (req, res) => {
  const { project, name, quantity, unit, notes } = req.body;

  const material = await Material.create({
    project,
    requestedBy: req.user._id,
    name,
    quantity,
    unit,
    notes,
    status: "pending"
  });

  res.status(201).json({
    message: "Material requested",
    material
  });
};

/* ================================================= */

const getMaterials = async (req, res) => {
  try {
    const { page, limit, skip } =
      getPagination(req.query);

    const filter = {};

    // Engineer visibility fix - only show pending requests
    if (req.user.role === "engineer") {
      filter.status = "pending";
    }

    if (req.query.project) {
      filter.project =
        req.query.project;
    }

    if (req.query.status) {
      filter.status =
        req.query.status;
    }

    const total =
      await Material.countDocuments(
        filter
      );

    const materials =
      await Material.find(filter)
        .populate(
          "project",
          "name"
        )
        .populate(
          "requestedBy",
          "name email role"
        )
        .populate(
          "approvedBy",
          "name email role"
        )
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit);

    res.status(200).json({
      data: materials,
      pagination: {
        page,
        totalPages:
          Math.ceil(
            total / limit
          ) || 1,
        total,
      },
    });
  } catch (error) {
    console.error(
      "GET MATERIALS ERROR:",
      error
    );

    res.status(500).json({
      message:
        error.message,
    });
  }
};

/* ================================================= */

const reviewMaterial = async (
  req,
  res
) => {
  const { id } = req.params;
  const { action } = req.body;

  const status =
    action === "approve"
      ? "approved"
      : "rejected";

  const material =
    await Material.findByIdAndUpdate(
      id,
      {
        status,
        approvedBy:
          req.user._id ||
          req.user.id,
        approvedAt:
          new Date(),
      },
      { new: true }
    );

  res.json({
    message:
      "Updated successfully",
    material,
  });
};

/* ================================================= */

const updateMaterialStatus =
  async (req, res) => {
    const { id } =
      req.params;
    const { status } =
      req.body;

    const material =
      await Material.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      );

    res.json({
      message:
        "Status updated",
      material,
    });
  };

module.exports = {
  requestMaterial:
    asyncHandler(
      requestMaterial
    ),
  getMaterials:
    asyncHandler(
      getMaterials
    ),
  reviewMaterial:
    asyncHandler(
      reviewMaterial
    ),
  updateMaterialStatus:
    asyncHandler(
      updateMaterialStatus
    ),
};