const User = require('../models/User');
const { getPagination } = require('../utils/pagination');

// Get all users
const getUsers = async (req, res) => {
  const { role, search } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const { page, limit, skip } = getPagination(req.query);
  const [total, users] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter)
      .select('-password')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
  ]);

  return res.status(200).json({
    data: users,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
};

module.exports = { getUsers };



