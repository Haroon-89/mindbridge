import chromadb
from chromadb.utils import embedding_functions
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from rag.cbt_data import cbt_documents

def ingest_cbt_data():
    print("Starting CBT data ingestion...")

    # Initialize ChromaDB — stores locally in rag/chroma_db folder
    client = chromadb.PersistentClient(path="rag/chroma_db")

    # Use sentence-transformers to convert text to vectors
    embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name="all-MiniLM-L6-v2"
    )

    # Create or get the collection
    collection = client.get_or_create_collection(
        name="cbt_knowledge_base",
        embedding_function=embedding_fn
    )

    # Check if already ingested
    if collection.count() > 0:
        print(f"Knowledge base already has {collection.count()} documents. Skipping.")
        return collection

    # Add all CBT documents
    collection.add(
        documents=cbt_documents,
        ids=[f"doc_{i}" for i in range(len(cbt_documents))]
    )

    print(f"Successfully ingested {collection.count()} CBT documents into ChromaDB!")
    return collection


def query_knowledge_base(query_text, n_results=2):
    client = chromadb.PersistentClient(path="rag/chroma_db")

    embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name="all-MiniLM-L6-v2"
    )

    collection = client.get_or_create_collection(
        name="cbt_knowledge_base",
        embedding_function=embedding_fn
    )

    results = collection.query(
        query_texts=[query_text],
        n_results=n_results
    )

    return results["documents"][0]


if __name__ == "__main__":
    ingest_cbt_data()

    # Test query
    print("\nTesting RAG retrieval...")
    test_query = "I feel very anxious and overwhelmed"
    results = query_knowledge_base(test_query)

    print(f"\nQuery: '{test_query}'")
    print("\nTop retrieved CBT exercises:")
    for i, doc in enumerate(results):
        print(f"\n{i+1}. {doc}")