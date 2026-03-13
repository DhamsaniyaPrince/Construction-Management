import { Link } from 'react-router-dom';

const NotFound = () => (
  <section className="text-center">
    <h1 className="text-3xl font-semibold text-gray-900">404</h1>
    <p className="mt-2 text-gray-600">The page you are looking for does not exist.</p>
    <Link to="/" className="mt-4 inline-block text-blue-600 underline">
      Go home
    </Link>
  </section>
);

export default NotFound;

