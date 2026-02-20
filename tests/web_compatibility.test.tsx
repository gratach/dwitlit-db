/**
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import App from '../packages/web/src/App';
import { Database } from '@dwitlit-db/data';

describe('Web environment compatibility', () => {
    test("renders app", () => {
      let db = new Database();
      render(<App db={db} />);

      const element = screen.getByText(/Database/i);

      expect(element).toBeInTheDocument();
  });
});
