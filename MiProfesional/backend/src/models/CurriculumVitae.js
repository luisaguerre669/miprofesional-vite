const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  name: { type: String, trim: true, required: true, maxlength: 80 },
  level: { type: String, enum: ['basico', 'intermedio', 'avanzado', 'experto'], default: 'intermedio' }
}, { _id: false });

const experienceSchema = new mongoose.Schema({
  jobTitle: { type: String, trim: true, maxlength: 140 },
  company: { type: String, trim: true, maxlength: 140 },
  startDate: { type: Date, default: null },
  endDate: { type: Date, default: null },
  current: { type: Boolean, default: false },
  description: { type: String, trim: true, maxlength: 1200 }
}, { _id: true });

const educationSchema = new mongoose.Schema({
  institution: { type: String, trim: true, maxlength: 160 },
  degree: { type: String, trim: true, maxlength: 160 },
  field: { type: String, trim: true, maxlength: 160 },
  startDate: { type: Date, default: null },
  endDate: { type: Date, default: null },
  current: { type: Boolean, default: false }
}, { _id: true });

const cvSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  visibility: {
    type: String,
    enum: ['private', 'public', 'recruiter-only'],
    default: 'private',
    index: true
  },
  personalData: {
    fullName: { type: String, trim: true, maxlength: 120 },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    headline: { type: String, trim: true, maxlength: 180 },
    summary: { type: String, trim: true, maxlength: 1600 }
  },
  photo: { type: String, trim: true, default: null },
  jobTitles: [{ type: String, trim: true, maxlength: 120 }],
  skills: [skillSchema],
  experience: [experienceSchema],
  education: [educationSchema],
  availability: {
    status: { type: String, enum: ['inmediata', '15-dias', '30-dias', 'a-convenir'], default: 'a-convenir' },
    mode: { type: String, enum: ['presencial', 'remoto', 'hibrido', 'indistinto'], default: 'indistinto' },
    hours: { type: String, enum: ['full-time', 'part-time', 'freelance', 'por-proyecto'], default: 'full-time' }
  },
  location: {
    city: { type: String, trim: true, maxlength: 100 },
    state: { type: String, trim: true, maxlength: 100 },
    country: { type: String, trim: true, default: 'Argentina' },
    coordinates: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }
    }
  },
  experienceLevel: {
    type: String,
    enum: ['entry', 'mid', 'senior', 'lead'],
    default: 'entry',
    index: true
  },
  experienceYears: { type: Number, default: 0, min: 0 },
  expectedSalary: { type: Number, default: null, min: 0 },
  dateOfBirth: { type: Date, default: null },
  isActive: { type: Boolean, default: true, index: true }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

cvSchema.index({ 'location.city': 1, 'location.state': 1 });
cvSchema.index({ 'skills.name': 1 });
cvSchema.index({ jobTitles: 1 });
cvSchema.index({ updatedAt: -1 });
cvSchema.index({ 'location.coordinates': '2dsphere' });
cvSchema.index({ experienceYears: 1 });
cvSchema.index({ expectedSalary: 1 });
cvSchema.index({ 'availability.hours': 1 });
cvSchema.index({ dateOfBirth: 1 });
cvSchema.index({
  'personalData.fullName': 'text',
  'personalData.headline': 'text',
  'personalData.summary': 'text',
  jobTitles: 'text',
  'skills.name': 'text',
  'experience.jobTitle': 'text',
  'experience.company': 'text',
  'education.degree': 'text',
  'education.field': 'text',
  'location.city': 'text',
  'location.state': 'text'
});

cvSchema.statics.searchForEmployers = function(filters = {}) {
  const {
    q,
    jobTitle,
    skills = [],
    location,
    experienceLevel,
    experienceYearsMin,
    experienceYearsMax,
    availability,
    salaryMin,
    salaryMax,
    ageMin,
    ageMax,
    limit = 20,
    page = 1
  } = filters;

  const query = {
    isActive: true,
    visibility: { $in: ['public', 'recruiter-only'] }
  };

  if (q) query.$text = { $search: q };
  if (jobTitle) query.jobTitles = { $regex: jobTitle, $options: 'i' };
  if (skills.length > 0) query['skills.name'] = { $all: skills.map((skill) => new RegExp(skill, 'i')) };
  if (location) {
    query.$or = [
      { 'location.city': { $regex: location, $options: 'i' } },
      { 'location.state': { $regex: location, $options: 'i' } }
    ];
  }
  if (experienceLevel) query.experienceLevel = experienceLevel;
  if (experienceYearsMin || experienceYearsMax) {
    query.experienceYears = {};
    if (experienceYearsMin) query.experienceYears.$gte = Number(experienceYearsMin);
    if (experienceYearsMax) query.experienceYears.$lte = Number(experienceYearsMax);
  }
  if (availability) query['availability.hours'] = availability;
  if (salaryMin || salaryMax) {
    query.expectedSalary = {};
    if (salaryMin) query.expectedSalary.$gte = Number(salaryMin);
    if (salaryMax) query.expectedSalary.$lte = Number(salaryMax);
  }
  if (ageMin || ageMax) {
    query.dateOfBirth = {};
    if (ageMax) {
      const upperBound = new Date();
      upperBound.setFullYear(upperBound.getFullYear() - Number(ageMax));
      upperBound.setHours(23, 59, 59, 999);
      query.dateOfBirth.$gte = upperBound;
    }
    if (ageMin) {
      const lowerBound = new Date();
      lowerBound.setFullYear(lowerBound.getFullYear() - Number(ageMin));
      lowerBound.setHours(0, 0, 0, 0);
      query.dateOfBirth.$lte = lowerBound;
    }
  }

  const skip = (page - 1) * limit;
  return this.find(query)
    .sort(q ? { score: { $meta: 'textScore' }, updatedAt: -1 } : { updatedAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('userId', 'name email phone avatar role');
};

cvSchema.methods.toPublicView = function() {
  return {
    _id: this._id,
    userId: this.userId ? { _id: this.userId._id, name: this.userId.name } : this.userId,
    visibility: this.visibility,
    personalData: {
      fullName: this.personalData?.fullName,
      headline: this.personalData?.headline
    },
    photo: this.photo,
    jobTitles: this.jobTitles,
    skills: this.skills?.map(s => ({ name: s.name, level: s.level })),
    experience: this.experience?.map(e => ({
      jobTitle: e.jobTitle,
      company: e.company,
      startDate: e.startDate,
      endDate: e.endDate,
      current: e.current
    })),
    education: this.education?.map(e => ({
      degree: e.degree,
      institution: e.institution,
      field: e.field
    })),
    experienceLevel: this.experienceLevel,
    experienceYears: this.experienceYears,
    availability: this.availability,
    location: this.location,
    updatedAt: this.updatedAt
  };
};

cvSchema.methods.toFullView = function() {
  const age = this.dateOfBirth
    ? Math.floor((Date.now() - new Date(this.dateOfBirth).getTime()) / (365.25 * 86400000))
    : null;
  return {
    _id: this._id,
    userId: this.userId,
    visibility: this.visibility,
    personalData: this.personalData,
    photo: this.photo,
    jobTitles: this.jobTitles,
    skills: this.skills,
    experience: this.experience,
    education: this.education,
    availability: this.availability,
    location: this.location,
    experienceLevel: this.experienceLevel,
    experienceYears: this.experienceYears,
    expectedSalary: this.expectedSalary,
    age,
    dateOfBirth: this.dateOfBirth,
    isActive: this.isActive,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

cvSchema.methods.toEmployerSummary = function() {
  const age = this.dateOfBirth
    ? Math.floor((Date.now() - new Date(this.dateOfBirth).getTime()) / (365.25 * 86400000))
    : null;
  return {
    _id: this._id,
    userId: this.userId,
    visibility: this.visibility,
    personalData: {
      fullName: this.personalData?.fullName,
      headline: this.personalData?.headline,
      summary: this.personalData?.summary
    },
    photo: this.photo,
    jobTitles: this.jobTitles,
    skills: this.skills,
    experienceLevel: this.experienceLevel,
    experienceYears: this.experienceYears,
    expectedSalary: this.expectedSalary,
    age,
    availability: this.availability,
    location: this.location,
    updatedAt: this.updatedAt
  };
};

module.exports = mongoose.model('CurriculumVitae', cvSchema);
