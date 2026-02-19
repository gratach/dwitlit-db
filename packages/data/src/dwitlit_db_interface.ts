// Public interface for the Dwitlit database
export interface IDwitlitDB {
    setDataNode(
        dwitlitId: string,
        links: [string, number | null][],
        data: Uint8Array,
        confirmationFlag: boolean | null
    ): number | null;

    getDataNode(internalId: number): [string, [string, number | null][] , Uint8Array, boolean] | null;

    removeDataNode(internalId: number): boolean | null;

    updateConfirmationFlag(internalId: number, flag: boolean): boolean;

    iterateDataNodes(): IterableIterator<number | null>;

    iterateLinks(
        internalId: number
    ): IterableIterator<[string, number | null] | null> | null;

    iterateDataNodesByDwitlitId(
        dwitlitId: string
    ): IterableIterator<number | null>;

    iterateGeneralBacklinks(
        dwitlitId: string
    ): IterableIterator<[number, number] | null>;

    iterateSpecificBacklinks(
        internalId: number
    ): IterableIterator<[number, number] | null> | null;

    close(): void;
}