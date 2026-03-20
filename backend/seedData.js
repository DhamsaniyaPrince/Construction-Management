const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');
const Project = require('./models/Project');
const MaterialRequest = require('./models/MaterialRequest');

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/construction-management', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Project.deleteMany({});
    await MaterialRequest.deleteMany({});

    // Create users
    const users = [
      {
        name: 'Admin User',
        email: 'admin@example.com',
        password: await bcrypt.hash('admin123', 10),
        role: 'admin',
        phone: '+91 98765 43210'
      },
      {
        name: 'Site Manager',
        email: 'manager@example.com',
        password: await bcrypt.hash('manager123', 10),
        role: 'site_manager',
        phone: '+91 98765 43211'
      },
      {
        name: 'John Contractor',
        email: 'contractor@example.com',
        password: await bcrypt.hash('contractor123', 10),
        role: 'contractor',
        phone: '+91 98765 43212'
      },
      {
        name: 'Jane Engineer',
        email: 'engineer@example.com',
        password: await bcrypt.hash('engineer123', 10),
        role: 'engineer',
        phone: '+91 98765 43213'
      },
      {
        name: 'Worker 1',
        email: 'worker@example.com',
        password: await bcrypt.hash('worker123', 10),
        role: 'worker',
        phone: '+91 98765 43214',
        dailyWage: 800,
        specialization: 'Carpentry',
        isAvailable: true
      },
      {
        name: 'Worker 2',
        email: 'worker2@example.com',
        password: await bcrypt.hash('worker123', 10),
        role: 'worker',
        phone: '+91 98765 43215',
        dailyWage: 750,
        specialization: 'Plumbing',
        isAvailable: true
      }
    ];

    const createdUsers = await User.insertMany(users);
    console.log('Users created');

    // Create projects
    const projects = [
      {
        projectId: 'PROJ-2024-001',
        name: 'Commercial Building Construction',
        projectType: 'commercial',
        description: 'Construction of a 5-story commercial building with modern amenities',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-12-31'),
        estimatedDuration: '12 months',
        status: 'active',
        priority: 'high',
        location: '123 Business Park, Mumbai, Maharashtra',
        budget: 50000000,
        materials: 15000000,
        clientName: 'ABC Corporation',
        clientContact: '+91 98765 11111',
        contractorDetails: 'XYZ Construction Pvt Ltd - Licensed contractor with 10+ years experience',
        teamSize: 25,
        permits: 'Building permit, Environmental clearance',
        insurance: 'Liability insurance, Worker compensation',
        engineers: [createdUsers[3]._id] // Jane Engineer
      },
      {
        projectId: 'PROJ-2024-002',
        name: 'Residential Complex',
        projectType: 'residential',
        description: 'Construction of 50 residential units with amenities',
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-11-30'),
        estimatedDuration: '9 months',
        status: 'planning',
        priority: 'medium',
        location: '456 Residential Area, Pune, Maharashtra',
        budget: 30000000,
        materials: 10000000,
        clientName: 'Real Estate Developers Ltd',
        clientContact: '+91 98765 22222',
        contractorDetails: 'BuildRight Construction - Specialized in residential projects',
        teamSize: 20,
        permits: 'Residential building permit',
        insurance: 'Comprehensive construction insurance'
      }
    ];

    const createdProjects = await Project.insertMany(projects);
    console.log('Projects created');

    // Create material requests
    const materialRequests = [
      {
        title: 'Cement for Foundation',
        description: 'High-grade cement required for foundation work of commercial building',
        materialType: 'raw_materials',
        quantity: 500,
        unit: 'tons',
        urgency: 'high',
        project: createdProjects[0]._id,
        requestedBy: createdUsers[1]._id, // Site Manager
        siteManager: createdUsers[1]._id,
        assignedContractor: createdUsers[2]._id, // John Contractor
        status: 'approved',
        estimatedDelivery: new Date('2024-02-15'),
        notes: 'Required for foundation pouring',
        budget: 2500000
      },
      {
        title: 'Steel Reinforcement',
        description: 'TMT steel bars for structural reinforcement',
        materialType: 'raw_materials',
        quantity: 100,
        unit: 'tons',
        urgency: 'urgent',
        project: createdProjects[0]._id,
        requestedBy: createdUsers[1]._id, // Site Manager
        siteManager: createdUsers[1]._id,
        assignedContractor: createdUsers[2]._id, // John Contractor
        status: 'ordered',
        estimatedDelivery: new Date('2024-02-10'),
        notes: 'Critical for structural integrity',
        budget: 5000000
      },
      {
        title: 'Safety Equipment',
        description: 'Personal protective equipment for workers',
        materialType: 'safety',
        quantity: 50,
        unit: 'pieces',
        urgency: 'medium',
        project: createdProjects[0]._id,
        requestedBy: createdUsers[1]._id, // Site Manager
        siteManager: createdUsers[1]._id,
        assignedContractor: createdUsers[2]._id, // John Contractor
        status: 'delivered',
        estimatedDelivery: new Date('2024-02-05'),
        actualDelivery: new Date('2024-02-04'),
        notes: 'Helmets, gloves, safety vests',
        budget: 50000,
        actualCost: 45000
      }
    ];

    await MaterialRequest.insertMany(materialRequests);
    console.log('Material requests created');

    console.log('Seed data created successfully!');
    console.log('\nLogin Credentials:');
    console.log('Admin: admin@example.com / admin123');
    console.log('Site Manager: manager@example.com / manager123');
    console.log('Contractor: contractor@example.com / contractor123');
    console.log('Engineer: engineer@example.com / engineer123');
    console.log('Worker: worker@example.com / worker123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
