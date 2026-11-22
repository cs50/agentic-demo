// Week 1, CS50 Mario (less comfortable): print a right-aligned pyramid of '#'
#include <cs50.h>
#include <stdio.h>

int main(void)
{
    // Prompt for a height between 1 and 8
    int height;
    do
    {
        height = get_int("Height: ");
    }
    while (height < 1 || height > 8);

    // One row per iteration: (height - i) spaces, then i hashes
    for (int i = 1; i <= height; i++)
    {
        for (int j = 0; j < height - i; j++)
        {
            printf(" ");
        }
        for (int k = 0; k < i; k++)
        {
            printf("#");
        }
        printf("\n");
    }
}
