import { render, screen, fireEvent } from '@testing-library/react';
import { DBVisualizer } from '@dwitlit-db/ui';
import { Database } from '@dwitlit-db/data';

describe('DatabaseVisualizer', () => {
  let db: Database;

  beforeEach(() => {
    db = new Database();
  });

  test('renders "No data" initially', () => {
    render(<DBVisualizer database={db} />);
    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  test('adds data to the database and displays it', () => {
    render(<DBVisualizer database={db} />);

    const idInput = screen.getByPlaceholderText('ID');
    const valueInput = screen.getByPlaceholderText('Value');
    const addButton = screen.getByText('Add/Update');

    fireEvent.change(idInput, { target: { value: 'test-id' } });
    fireEvent.change(valueInput, { target: { value: 'test-value' } });
    fireEvent.click(addButton);

    expect(screen.getByText('test-id')).toBeInTheDocument();
    expect(screen.getByText('"test-value"')).toBeInTheDocument();
    expect(screen.queryByText('No data')).not.toBeInTheDocument();
  });

  test('updates data in the database', () => {
    db.setData('test-id', 'old-value');
    render(<DBVisualizer database={db} />);

    expect(screen.getByText('"old-value"')).toBeInTheDocument();

    const idInput = screen.getByPlaceholderText('ID');
    const valueInput = screen.getByPlaceholderText('Value');
    const addButton = screen.getByText('Add/Update');

    fireEvent.change(idInput, { target: { value: 'test-id' } });
    fireEvent.change(valueInput, { target: { value: 'new-value' } });
    fireEvent.click(addButton);

    expect(screen.getByText('"new-value"')).toBeInTheDocument();
    expect(screen.queryByText('"old-value"')).not.toBeInTheDocument();
  });

  test('deletes data from the database', () => {
    db.setData('test-id', 'test-value');
    render(<DBVisualizer database={db} />);

    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    expect(screen.queryByText('test-id')).not.toBeInTheDocument();
    expect(screen.getByText('No data')).toBeInTheDocument();
  });
});
