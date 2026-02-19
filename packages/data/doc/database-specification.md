# Dwitlit Database Specification

## General Structure

A dwitlit database is a collection of data nodes that are defined by the following properties:
- **dwitlit id**: 
    A non unique identifier for the data node.
    It is a ASCII string that can contain A-Z, a-z, 0-9, and the characters `-`, `_`, `/`, and `.`.
- **link list**:
    A list of zero or more links that can be of two types:
    - **general link**: 
        A link that points to a dwitlit id.
        It is not necessary that the dwitlit id exists in the database.
    - **specific link**: 
        A link that points to a specific data node.
        This link is only valid if the data node exists in the database.
        Specific links must not form cycles, meaning that a data node cannot have a specific link to itself or to any of its ancestors in the link graph.
    A link is represented as a tuple of the form `(dwitlit_id, internal_id)`.
    For general links, the `internal_id` is set to null, while for specific links, the `internal_id` is a unique identifier for the data node within the database.
- **data**:
    A bytestring that contains the actual data of the node.

Each combination of these three properties can only exist once in the database.

Two additional properties are assigned to each data node:
- **internal id**:
    A unique identifier for the data node within the database.
    It is a non negative integer that is assigned by the database when the data node is created.
- **confirmation flag**:
    A boolean value that indicates whether the statement represented by the data node is confirmed or not.

## Internal Structure

The database contains the following tables:
- **dwitlit ids table**:
    This table contains all the dwitlit ids in the database.
    The dwitlit ids that are used to define the data nodes as well as the dwitlit ids that are used in the links must be present in this table.
    It contains the following columns:
    - `dwitlit_id_id`: the unique identifier for the dwitlit id (primary key).
    - `dwitlit_id`: the dwitlit id string.
- **data table**:
    This table contains all the data in the database.
    It contains the following columns:
    - `data_id`: the unique identifier for the data (primary key).
    - `data`: the bytestring that contains the actual data of the node.
- **links table**:
    This table contains all the links in the database.
    It contains the following columns:
    - `link_id`: the unique identifier for the link (primary key).
    - `source_internal_id`: the internal id of the source data node (foreign key to the data nodes table).
    - `dwitlit_id_id`: the identifier for the dwitlit id of the link (foreign key to the dwitlit ids table).
    - `target_internal_id`: the internal id of the target data node (foreign key to the data nodes table, can be null for general links).
    - `link_index`: the index of the link in the link list of the source data node (starting from 0).
- **data nodes table**:
    This table contains all the data nodes in the database.
    It contains the following columns:
    - `internal_id`: the unique identifier for the data node (primary key).
    - `dwitlit_id_id`: the identifier for the dwitlit id of the data node (foreign key to the dwitlit ids table).
    - `data_id`: the unique identifier for the data of the node (foreign key to the data table).
    - `link_list_length`: the length of the link list of the data node.
    - `confirmation_flag`: the boolean value that indicates whether the statement represented by the data node is confirmed or not.

## Functions

The database provides the following functions:
- **set_data_node(dwitlit_id, link_list, data, confirmation_flag)**:
    This function adds a new data node to the database with the given dwitlit id, link list, data, and confirmation flag.
    It returns the internal id of the newly created data node.
    If the combination of dwitlit id, link list and data already exists in the database, it returns the internal id of the existing data node and sets the confirmation flag of the existing data node to the given confirmation flag if it is not null.
    If the confirmation flag is null, it does not change the confirmation flag of the existing data node but sets it to false if the node did not exist before.
    The function returns null if the link list contains specific links that point to data nodes that do not exist in the database.
    In this case, the data node is not added to the database.
    If the main dwitlit id or the dwitlit ids in the link list contain invalid characters an error is thrown and the data node is not added to the database.
- **get_data_node(internal_id)**:
    This function retrieves the data node with the given internal id from the database.
    It returns a tuple containing the dwitlit id, link list, data, and confirmation flag of the data node.
    The function returns null if the data node with the given internal id does not exist in the database.
- **remove_data_node(internal_id)**:
    This function removes the data node with the given internal id from the database if there are no specific links pointing to it.
    It returns true if the data node was successfully removed, false if the data node could not be removed because there are specific links pointing to it, and null if the data node with the given internal id does not exist in the database.
- **update_confirmation_flag(internal_id, confirmation_flag)**:
    This function updates the confirmation flag of the data node with the given internal id to the given confirmation flag.
    It returns true if the confirmation flag was successfully updated and false if the data node with the given internal id does not exist in the database.
- **iterate_data_nodes()**:
    This function returns an iterator over all the data nodes in the database.
    Each element of the iterator is the internal id of a data node.
    If the database gets modified while the iterator is being used, the iterator returns a final null element and stops iterating.
- **iterate_links(internal_id)**:
    This function returns an iterator over all the links of the data node with the given internal id.
    Each element of the iterator is a tuple containing the dwitlit id and the target internal id (or null for general links).
    The function returns null if the data node with the given internal id does not exist in the database.
    If the database gets modified while the iterator is being used, the iterator returns a final null element and stops iterating.
- **iterate_data_nodes_by_dwitlit_id(dwitlit_id)**:
    This function returns an iterator over all the data nodes in the database that have the given dwitlit id.
    Each element of the iterator is the internal id of a data node.
    The function returns an empty iterator if there are no data nodes with the given dwitlit id in the database.
    If the database gets modified while the iterator is being used, the iterator returns a final null element and stops iterating.
- **iterate_general_backlinks(dwitlit_id)**:
    This function returns an iterator over all general links in the database that point to the given dwitlit id.
    Each element of the iterator is a tuple containing the internal id of the source data node and the index of the link in the link list of the source data node.
    The function returns an empty iterator if there are no data nodes with a general link to the given dwitlit id in the database.
    If the database gets modified while the iterator is being used, the iterator returns a final null element and stops iterating.
- **iterate_specific_backlinks(internal_id)**:
    This function returns an iterator over all specific links in the database that point to the data node with the given internal id.
    Each element of the iterator is a tuple containing the internal id of the source data node and the index of the link in the link list of the source data node.
    The function returns an empty iterator if there are no data nodes with a specific link to the data node with the given internal id in the database.
    The function returns null if the data node with the given internal id does not exist in the database.
    If the database gets modified while the iterator is being used, the iterator returns a final null element and stops iterating.

## Implementation Notes

Database suggestion: better-sqlite3, but any database that supports the required functionality can be used.
It should support flexible support for:
- in memory use
- file based use
- server based use
