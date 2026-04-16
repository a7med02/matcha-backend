import { db } from "../orm/client";

const runTest = async () => {
    // const response = await db.users.persist.createMany(
    //     [
    //         {
    //             first_name: "John1",
    //             last_name: "Doe",
    //             username: "johndoe2342",
    //         },
    //         {
    //             first_name: "John2",
    //             last_name: "Doe",
    //             username: "johndoe456",
    //         },
    //         {
    //             first_name: "John3",
    //             last_name: "Doe",
    //             username: "johndoe789",
    //         },
    //     ],
    //     ["id", "first_name", "last_name", "username", "created_at", "updated_at"]
    // );

    const response = await db.users.mutation.delete({
        id: {
            in: [
                "76dc51b5-a3da-4e57-b812-93eba3c9c1ac",
                "c7a12c8c-ad43-4b3f-a14f-d07fb38d39c1",
                "e31b4297-d77d-4eb8-8cc0-9a4db26b2c7b",
                "c4d5f649-4b8e-470b-a8f9-82ca0625f608",
            ],
        },
    });

    console.log(response);
};

runTest();

