const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const User = require('../models/User');
const Note = require('../models/Note');
const Book = require('../models/Book');
const Doubt = require('../models/Doubt');
const Answer = require('../models/Answer');
const Event = require('../models/Event');
const Notification = require('../models/Notification');
const Report = require('../models/Report');

dotenv.config();

const base64Png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
const pngBuffer = Buffer.from(base64Png, 'base64');

/**
 * Ensure initial media and document files exist for seed records
 */
const setupMockAssets = () => {
  const folders = {
    books: ['seed-book-1.png', 'seed-book-2.png', 'seed-book-3.png'],
    banners: ['seed-banner-1.png', 'seed-banner-2.png', 'seed-banner-3.png'],
    notes: ['seed-note-1.pdf', 'seed-note-2.pdf'],
  };

  Object.entries(folders).forEach(([folder, files]) => {
    const dir = path.join(__dirname, '../uploads', folder);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    files.forEach((file) => {
      const filePath = path.join(dir, file);
      if (!fs.existsSync(filePath)) {
        if (file.endsWith('.pdf')) {
          fs.writeFileSync(filePath, '%PDF-1.4 sample lecture note document content for testing...');
        } else {
          fs.writeFileSync(filePath, pngBuffer);
        }
      }
    });
  });
};

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus_connect');
    console.log('Database connected for seeding...');

    // Clear seed data only, preserving user-registered accounts
    const seededEmails = [
      'admin@campusconnect.edu',
      'jack@campusconnect.edu',
      'aisha@campusconnect.edu',
      'tony@campusconnect.edu',
      'vikram@campusconnect.edu',
      'peter@campusconnect.edu',
      'rohan@campusconnect.edu',
      'hermione@campusconnect.edu',
      'bruce@campusconnect.edu',
      'kane@gmail.com',
    ];
    await User.deleteMany({ email: { $in: seededEmails } });
    await Note.deleteMany();
    await Book.deleteMany();
    await Doubt.deleteMany();
    await Answer.deleteMany();
    await Event.deleteMany();
    await Notification.deleteMany();
    await Report.deleteMany();
    console.log('Database cleared of old seed items (registered user accounts preserved).');

    // 1. Create Users
    const users = await User.create([
      {
        name: 'Captain Jack Sparrow',
        email: 'jack@campusconnect.edu',
        password: 'admin123',
        role: 'admin',
        department: 'Information Technology',
        year: 4,
        bio: 'Official platform administrator. Why is the rum always gone?',
        profilePic: '/uploads/profiles/seed-avatar-jack.jpg?v=2026_char_v2',
        activityTimeline: [{ activityType: 'Seeder', description: 'Admin profile seeded' }],
      },
      {
        name: 'Tony Stark',
        email: 'tony@campusconnect.edu',
        password: 'student123',
        department: 'Computer Science',
        year: 3,
        bio: 'Genius, billionaire, playboy, philanthropist. CS Sem 6. Genius notes uploaded.',
        profilePic: '/uploads/profiles/seed-avatar-tony.jpg?v=2026_char_v2',
        activityTimeline: [{ activityType: 'Seeder', description: 'Student profile seeded' }],
      },
      {
        name: 'Peter Parker',
        email: 'peter@campusconnect.edu',
        password: 'student123',
        department: 'Electrical Engineering',
        year: 2,
        bio: 'Your friendly neighborhood engineer! Building web-shooters & robotics lab stuff.',
        profilePic: '/uploads/profiles/seed-avatar-peter.jpg?v=2026_char_v2',
        activityTimeline: [{ activityType: 'Seeder', description: 'Student profile seeded' }],
      },
      {
        name: 'Hermione Granger',
        email: 'hermione@campusconnect.edu',
        password: 'student123',
        department: 'Mechanical Engineering',
        year: 1,
        bio: 'Top of class! Reading Beer & Johnston mechanics textbook in the library.',
        profilePic: '/uploads/profiles/seed-avatar-hermione.jpg?v=2026_char_v2',
        activityTimeline: [{ activityType: 'Seeder', description: 'Student profile seeded' }],
      },
      {
        name: 'Bruce Wayne',
        email: 'bruce@campusconnect.edu',
        password: 'student123',
        department: 'Computer Science',
        year: 3,
        bio: 'I am Vengeance. CS Student by day, Batcave builder by night.',
        profilePic: '/uploads/profiles/seed-avatar-bruce.jpg?v=2026_char_v2',
        activityTimeline: [{ activityType: 'Seeder', description: 'Student profile seeded' }],
      },
      // Email aliases so legacy login credentials work
      {
        name: 'Tony Stark',
        email: 'aisha@campusconnect.edu',
        password: 'student123',
        department: 'Computer Science',
        year: 3,
        bio: 'Genius, billionaire, playboy, philanthropist.',
        profilePic: '/uploads/profiles/seed-avatar-tony.jpg?v=2026_char_v2',
      },
      {
        name: 'Peter Parker',
        email: 'vikram@campusconnect.edu',
        password: 'student123',
        department: 'Electrical Engineering',
        year: 2,
        bio: 'Your friendly neighborhood engineer!',
        profilePic: '/uploads/profiles/seed-avatar-peter.jpg?v=2026_char_v2',
      },
      {
        name: 'Hermione Granger',
        email: 'rohan@campusconnect.edu',
        password: 'student123',
        department: 'Mechanical Engineering',
        year: 1,
        bio: 'Top of class!',
        profilePic: '/uploads/profiles/seed-avatar-hermione.jpg?v=2026_char_v2',
      },
      {
        name: 'Captain Jack Sparrow',
        email: 'admin@campusconnect.edu',
        password: 'admin123',
        role: 'admin',
        department: 'Information Technology',
        year: 4,
        bio: 'Official platform administrator.',
        profilePic: '/uploads/profiles/seed-avatar-jack.jpg?v=2026_char_v2',
      },
    ]);
    console.log('Users seeded.');

    const adminUser = users[0];
    const userAisha = users[1];
    const userVikram = users[2];
    const userRohan = users[3];
    const userKane = users[4];

    // 2. Create Notes
    const notes = await Note.create([
      {
        title: "CS204 Algorithms - Complete Midterm Prep & DP Cheat Sheet (Fall '25)",
        description: "Hand-written notes covering Divide & Conquer, DP state transitions, and graph traversals. Includes solved past paper questions from Prof. Sharma's midterm.",
        subject: 'Algorithms',
        semester: 5,
        department: 'Computer Science',
        fileUrl: '/uploads/notes/seed-note-1.pdf',
        uploadedBy: userAisha._id,
        downloadsCount: 42,
        viewsCount: 156,
      },
      {
        title: 'Signals & Systems (ECE301) - Fourier & Laplace Formula Sheets',
        description: 'Quick reference sheet for Z-transform properties, impulse responses, and Bode plots. Prepared right before the end-sem exam.',
        subject: 'Signals & Systems',
        semester: 4,
        department: 'Electrical Engineering',
        fileUrl: '/uploads/notes/seed-note-2.pdf',
        uploadedBy: userVikram._id,
        downloadsCount: 18,
        viewsCount: 49,
      },
    ]);
    console.log('Notes seeded.');

    // 3. Create Books
    const books = await Book.create([
      {
        title: 'CLRS Introduction to Algorithms (3rd Ed)',
        description: 'Hardcover edition. Minor pencil marks on Ch 15 (Dynamic Programming), rest clean. Can hand over near the CS block.',
        price: 1200,
        condition: 'Like New',
        department: 'Computer Science',
        semester: 3,
        imageUrl: '/uploads/books/seed-book-1.png',
        soldBy: userAisha._id,
        status: 'available',
      },
      {
        title: 'Fundamentals of Microelectronics - Behzad Razavi',
        description: 'Spine has some wear from 2 semesters of use, but all pages intact. Essential for ECE302.',
        price: 750,
        condition: 'Good',
        department: 'Electrical Engineering',
        semester: 4,
        imageUrl: '/uploads/books/seed-book-2.png',
        soldBy: userVikram._id,
        status: 'available',
      },
      {
        title: 'Vector Mechanics for Engineers: Statics (12th Ed)',
        description: 'Bought for Sem 1 but ended up using the library PDF. Plastic wrap opened but never used.',
        price: 1450,
        condition: 'New',
        department: 'Mechanical Engineering',
        semester: 1,
        imageUrl: '/uploads/books/seed-book-3.png',
        soldBy: userRohan._id,
        status: 'available',
      },
    ]);
    console.log('Books seeded.');

    // 4. Create Doubts and Answers
    const doubt1 = await Doubt.create({
      title: 'Why does Bellman-Ford need V-1 relaxations?',
      description: 'I understand Dijkstra uses greedy choice for non-negative weights, but why exactly does Bellman-Ford require V-1 passes over all edges to guarantee shortest paths when no negative cycles exist?',
      tags: ['Algorithms', 'Graphs', 'CSE301'],
      author: userRohan._id,
      upvotes: [userAisha._id, userVikram._id],
      viewsCount: 78,
    });

    const answer1 = await Answer.create({
      doubt: doubt1._id,
      content: "A simple path in a graph with V vertices can have at most V-1 edges. If relaxing a V-th time still shortens any path, it means you've traversed a cycle that keeps decreasing total weight — which proves a negative cycle exists!",
      author: userVikram._id,
      upvotes: [userAisha._id],
      isAccepted: true,
    });

    // Update accepted answer link
    doubt1.acceptedAnswer = answer1._id;
    await doubt1.save();

    const doubt2 = await Doubt.create({
      title: 'Difference between React.memo and useMemo?',
      description: 'I am confused when to wrap my components in React.memo versus when to wrap calculations in useMemo. Do they do the same caching under the hood?',
      tags: ['React', 'JavaScript', 'WebDev'],
      author: userVikram._id,
      viewsCount: 35,
    });

    await Answer.create({
      doubt: doubt2._id,
      content: 'They are different. React.memo is a Higher-Order Component (HOC) used to memoize component re-rendering. It skips rendering the component if its props did not change. \n\nuseMemo, on the other hand, is a React Hook used inside a component function to memoize the result of an expensive calculation between renders.',
      author: userAisha._id,
      upvotes: [userVikram._id],
      isAccepted: false,
    });

    console.log('Doubts and Answers seeded.');

    // 5. Create Events
    const today = new Date();
    const event1Date = new Date();
    event1Date.setDate(today.getDate() + 5);
    const event2Date = new Date();
    event2Date.setDate(today.getDate() + 14);

    const events = await Event.create([
      {
        title: 'HackCampus 2026 - 24 Hour Student Hackathon',
        description: '24-hour build sprint. Free food, stickers, and ₹500,000 in prizes. Open to all branches.',
        venue: 'Main Library Seminar Wing B',
        date: event1Date,
        time: '09:00 AM',
        bannerUrl: '/uploads/banners/seed-banner-1.png',
        organizer: adminUser._id,
        bookmarkedBy: [userAisha._id, userVikram._id],
      },
      {
        title: 'Tech Talk: RAG Architectures & LLMs in Production',
        description: 'Talk by campus alumni working on AI agents. Covering vector DBs, retrieval pipelines, and Q&A.',
        venue: 'CS Department Hall A',
        date: event2Date,
        time: '02:30 PM',
        bannerUrl: '/uploads/banners/seed-banner-2.png',
        organizer: userAisha._id,
        bookmarkedBy: [userVikram._id],
      },
    ]);
    console.log('Events seeded.');

    // Update users' bookmarks
    userAisha.bookmarkedEvents.push(events[0]._id);
    userAisha.bookmarkedNotes.push(notes[1]._id);
    userAisha.savedBooks.push(books[1]._id);
    await userAisha.save();

    userVikram.bookmarkedEvents.push(events[0]._id);
    userVikram.bookmarkedEvents.push(events[1]._id);
    await userVikram.save();

    // 6. Create Notifications
    await Notification.create([
      {
        user: userAisha._id,
        type: 'doubt_answer',
        message: 'Peter Parker replied to your question about Bellman-Ford cycles.',
        link: `/doubts/${doubt1._id}`,
        isRead: false,
      },
      {
        user: userVikram._id,
        type: 'answer_accepted',
        message: 'Tony Stark accepted your answer as helpful for: "How does Bellman-Ford..."',
        link: `/doubts/${doubt1._id}`,
        isRead: true,
      },
    ]);
    console.log('Notifications seeded.');

    // 7. Create Reports
    await Report.create([
      {
        reportedBy: userRohan._id,
        itemType: 'Book',
        itemId: books[2]._id,
        reason: 'Duplicate listing. The seller has listed this twice.',
        status: 'Pending',
      },
    ]);
    console.log('Reports seeded.');

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding Error:', error);
    process.exit(1);
  }
};

// Start seeding process
setupMockAssets();
seedData();
