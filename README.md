# Drug-Secure Dashboard

This is a React-, TypeScript-, and Vite-based dashboard application leveraging K-Means clustering for data analysis, Tailwind CSS for styling, Recharts for data visualization, and GSAP for animations.

## Prerequisites

Before you begin, ensure you have met the following requirements:
* You have installed **Node.js** (v18 or higher recommended).
* You have a package manager installed, such as **npm** (comes with Node.js), **yarn**, or **pnpm**.

## Getting Started Locally

Follow these straightforward steps to set up and run the project on your local machine:

### 1. Clone the repository
```bash
# Clone the repository (replace with your actual repo URL)
git clone <repository-url>

# Navigate into the project directory
cd <repository-directory>
```

### 2. Install dependencies
Install all the required packages for the project. If you are using `npm`, run:
```bash
npm install
```

### 3. Start the development server
To run the app in development mode, execute:
```bash
npm run dev
```

The application will start, and you can view it by opening `http://localhost:5173` in your web browser. The page will reload automatically if you make any edits.

## Available Scripts

In the project directory, you can run the following commands:

- `npm run dev` - Starts the Vite local development server.
- `npm run build` - Compiles TypeScript to JavaScript and builds the application for production.
- `npm run lint` - Runs ESLint to check for code quality and style issues.
- `npm run preview` - Starts a local web server to preview your production build.

## Tech Stack

- **Framework**: [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [GSAP](https://gsap.com/)
- **Charts**: [Recharts](https://recharts.org/)
- **Clustering / ML**: [ml-kmeans](https://github.com/mljs/kmeans)
- **Icons**: [Lucide React](https://lucide.dev/)

## Contributing

We welcome contributions! To start contributing:

1. Create a new branch for your feature or bugfix: `git checkout -b feature/your-feature-name`
2. Make your changes and test them thoroughly.
3. Ensure your code satisfies linting guidelines: `npm run lint`
4. Commit your changes with a descriptive message: `git commit -m 'Add a cool new feature'`
5. Push to the branch: `git push origin feature/your-feature-name`
6. Open a Pull Request on the repository.
