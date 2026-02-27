# SkillLedger - Dynamic & Verifiable Human Skill Graph System

A production-ready web platform that allows users to build a real, verifiable skill graph beyond degrees and resumes.

## Features

### Authentication System
- JWT-based authentication
- Role-based access (Student, Recruiter, Admin)
- Secure password hashing with bcrypt

### User Dashboards

#### Student Dashboard
- Create and manage skill profiles
- Add skills with proficiency levels (1-5)
- Attempt micro skill challenges
- View skill credibility scores
- See skill evolution over time with graph visualization

#### Recruiter Dashboard
- Search users by skill combinations
- Filter by credibility scores
- View candidate skill graphs
- Download structured skill reports

### Skill Verification Engine
- Micro challenge submission system
- Peer endorsement with weighted scoring
- Skill scoring algorithm
- Timestamp-based verification

### Skill Graph Visualization
- Interactive graph showing skill relationships
- Uses Cytoscape.js for graph rendering
- Dynamic display of skill strengths

## Tech Stack

- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Frontend**: React, Axios, Cytoscape.js
- **Authentication**: JWT
- **Database**: MongoDB
- **Graph Visualization**: Cytoscape.js

## Database Schema

### Users
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (student/recruiter/admin),
  skills: [ObjectId],
  credibilityScore: Number,
  profileImage: String,
  bio: String,
  createdAt: Date
}
```

### Skills
```javascript
{
  name: String,
  user: ObjectId,
  proficiencyLevel: Number (1-5),
  category: String,
  endorsements: [{
    endorser: ObjectId,
    weight: Number,
    timestamp: Date
  }],
  challenges: [{
    challenge: ObjectId,
    passed: Boolean,
    timestamp: Date
  }],
  score: Number,
  relatedSkills: [{
    skill: ObjectId,
    strength: Number (0-1)
  }],
  verified: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Endorsements
```javascript
{
  skill: ObjectId,
  endorser: ObjectId,
  weight: Number,
  timestamp: Date
}
```

### Challenges
```javascript
{
  skill: ObjectId,
  title: String,
  description: String,
  submissions: [{
    user: ObjectId,
    passed: Boolean,
    timestamp: Date
  }],
  createdAt: Date
}
```

### Scores
```javascript
{
  user: ObjectId,
  totalScore: Number,
  history: [{
    date: Date,
    score: Number
  }]
}
```

## Skill Scoring Algorithm

```
Skill Score = (Proficiency Level * 0.5) + (Endorsement Count * 0.3) + (Challenges Passed * 0.2)
```

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd skillledger/backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```env
MONGO_URI=mongodb://localhost:27017/skillledger
JWT_SECRET=your_jwt_secret_here
PORT=5000
```

4. Start the backend server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd skillledger/frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the frontend development server:
```bash
npm start
```

### Database Setup

1. Ensure MongoDB is running locally or provide a cloud MongoDB URI
2. The application will automatically create collections and indexes on first run

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/scores` - Get user credibility scores

### Skills
- `GET /api/skills/my-skills` - Get user's skills
- `POST /api/skills/add` - Add new skill
- `PUT /api/skills/:id` - Update skill
- `GET /api/skills/graph` - Get skill graph data

### Endorsements
- `POST /api/endorsements/add` - Add endorsement
- `GET /api/endorsements/:skillId` - Get skill endorsements

### Challenges
- `GET /api/challenges` - Get available challenges
- `POST /api/challenges/submit` - Submit challenge response

### Recruiter
- `GET /api/recruiter/search` - Search candidates
- `GET /api/recruiter/candidate/:id` - Get candidate profile
- `GET /api/recruiter/report/:id` - Download candidate report

## Usage

1. Register as a student or recruiter
2. Students can add skills, attempt challenges, and view their skill graph
3. Recruiters can search for candidates and view their profiles
4. Admins can manage users and challenges

## Development

### Project Structure
```
skillledger/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── utils/
│   └── public/
└── README.md
```

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.

## Contact

For questions or support, please contact the development team.
