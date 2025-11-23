using UnityEngine;   // ★ 이거 필수

public class PrtPosition : MonoBehaviour
{
    float startingPoint;
    bool isOver20 = true;
    bool isOver40 = true;

    void Start()
    {
        startingPoint = transform.position.z;
    }

    void Update()
    {
        float distance;
        distance = transform.position.z - startingPoint;

        if (distance > 40)
        {
            if (isOver40)
            {
                Debug.Log("Over 40 distance: " + distance);
                isOver40 = false;
            }
        }
        else if (distance > 20)
        {
            if (isOver20)
            {
                Debug.Log("Over 20 distance: " + distance);
                isOver20 = false;
            }
        }
    }
}
