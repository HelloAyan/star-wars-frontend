import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { AiOutlineLeft, AiOutlineRight } from "react-icons/ai";
import debounce from "lodash.debounce";
import { RxCross1 } from "react-icons/rx";

const ProductGrid = () => {
    const [characters, setCharacters] = useState([]);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedChar, setSelectedChar] = useState(null);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false); // loader state
    const itemsPerPage = 10;

    const fetchCharacters = async (query = "", page = 1) => {
        setLoading(true);
        try {
            const res = await axios.get(
                `https://star-wars-backend-hne5.onrender.com/characters?${query ? `search=${query}&` : ""}page=${page}`
            );
            setCharacters(res.data.results);
            setTotalPages(Math.ceil(res.data.total / itemsPerPage));
        } catch (error) {
            console.error("Error fetching characters:", error);
            setCharacters([]);
            setTotalPages(1);
        } finally {
            setLoading(false);
        }
    };

    const debouncedSearch = useCallback(
        debounce((query) => {
            setCurrentPage(1);
            fetchCharacters(query, 1);
        }, 500),
        []
    );

    useEffect(() => {
        fetchCharacters("", currentPage);
    }, [currentPage]);

    useEffect(() => {
        debouncedSearch(search);
    }, [search, debouncedSearch]);

    const fetchCharacterDetails = async (char) => {
        try {
            const details = { ...char };

            if (char.homeworld) {
                const hw = await axios.get(char.homeworld);
                details.homeworld_name = hw.data.name;
            }

            if (char.species && char.species.length > 0) {
                const sp = await axios.get(char.species[0]);
                details.species_name = sp.data.name;
            } else {
                details.species_name = "Unknown";
            }

            if (char.films && char.films.length > 0) {
                const films = await Promise.all(char.films.map((url) => axios.get(url)));
                details.film_titles = films.map((f) => f.data.title);
            } else {
                details.film_titles = [];
            }

            setSelectedChar(details);
        } catch (error) {
            console.error("Error fetching character details:", error);
        }
    };

    return (
        <div className="p-4 md:p-8">
            {/* Search */}
            <div className="flex justify-end mb-4 relative w-full max-w-sm mx-auto">
                <input
                    type="text"
                    placeholder="Search characters..."
                    className="w-full border border-gray-300 rounded px-3 py-1 outline-none pr-8" // pr-8 to make space for icon
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                    <button
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-800  cursor-pointer "
                        onClick={() => setSearch("")}
                    >
                        <RxCross1 />
                    </button>
                )}
            </div>

            {/* Loader */}
            {loading && (
                <div className="flex justify-center items-center my-10">
                    <div
                        className="w-12 h-12 border-4 border-t-[#002A64] border-gray-200 rounded-full animate-spin"
                    ></div>
                </div>
            )}

            {/* No items found */}
            {!loading && characters.length === 0 && (
                <div className="text-center text-gray-600 mt-10 text-lg font-semibold">
                    No items found
                </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {!loading &&
                    characters.map((char, index) => (
                        <div
                            key={index}
                            className="border rounded-lg p-4 flex flex-col items-center bg-white shadow hover:shadow-lg transition cursor-pointer"
                            onClick={() => fetchCharacterDetails(char)}
                        >
                            <div className="w-16 h-16 bg-[#002A64] rounded-full flex items-center justify-center text-white text-xl mb-2">
                                {index + 1 + (currentPage - 1) * itemsPerPage}
                            </div>
                            <h3 className="font-semibold text-center mb-2">{char.name}</h3>
                            <p className="text-center text-gray-600 text-sm">
                                Birth Year: {char.birth_year}
                            </p>
                            <p className="text-center text-gray-600 text-sm">Gender: {char.gender}</p>
                        </div>
                    ))}
            </div>

            {/* Pagination */}
            {!loading && characters.length > 0 && (
                <div className="flex justify-center items-center mt-6 gap-2 text-[#002A64]">
                    <button
                        className="px-2 py-1 border rounded hover:bg-[#0888FF] hover:text-white transition"
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    >
                        <AiOutlineLeft size={20} />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => (
                        <button
                            key={i + 1}
                            className={`px-2 py-1 border rounded ${currentPage === i + 1 ? "bg-[#0888FF] text-white" : ""
                                }`}
                            onClick={() => setCurrentPage(i + 1)}
                        >
                            {i + 1}
                        </button>
                    ))}
                    <button
                        className="px-2 py-1 border rounded hover:bg-[#0888FF] hover:text-white transition"
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    >
                        <AiOutlineRight size={20} />
                    </button>
                </div>
            )}

            {/* Character Details Modal */}
            {selectedChar && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-lg w-11/12 md:w-2/3 lg:w-1/2 relative">
                        <button
                            className="absolute top-2 right-2 text-xl font-bold"
                            onClick={() => setSelectedChar(null)}
                        >
                            &times;
                        </button>
                        <h2 className="text-2xl font-bold mb-2">{selectedChar.name}</h2>
                        <p><strong>Birth Year:</strong> {selectedChar.birth_year}</p>
                        <p><strong>Gender:</strong> {selectedChar.gender}</p>
                        <p><strong>Homeworld:</strong> {selectedChar.homeworld_name}</p>
                        <p><strong>Species:</strong> {selectedChar.species_name}</p>
                        <p><strong>Movies:</strong> {selectedChar.film_titles.join(", ") || "None"}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductGrid;
